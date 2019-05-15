#lang racket

(require racket/hash)

(provide graph-syntax)

(define (store-include store key values)
  (define old-val (hash-ref store key (set)))
  (define new-val (set-union old-val values))
  (hash-set store key new-val))

(define (store-union s1 s2)
  (hash-union s1 s2 #:combine set-union))

(define (desugar e)
  #;(
     input lang
     e :=
     (let ([x e]) e)
     (e e)
     a
          
     a :=
     (lambda (x) e)
     x

     output lang
     e :=
     (let ([x (a a)]) e)
     a
          
     a :=
     (lambda (x) e)
     x (unique)
   )
  (define (app? app)
    (match app
      [`(let . ,_) #f][`(lambda . ,_) #f][(? list?) #t][else #f]))
  (define (make-atomic e make-base)
    (match e
      [`(let ,b ,le)
       `(let ,b ,(make-atomic le make-base))]
      [`(lambda . ,_) (make-base e)]
      [(? symbol? x) (make-base x)]))
  (define (make-multi-atomic es make-base)
    (if (null? es)
        (make-base '())
        (make-atomic (car es) (lambda (a)
                                (make-multi-atomic
                                 (cdr es)
                                 (lambda (as) (make-base (cons a as))))))))
  (define (dse e names)
    (match e
      [`(let ([,x ,(? app? app)]) ,e1)
       (define gx (gensym x))
       (define ns/gx (hash-set names x gx))
       (make-multi-atomic
        (map (lambda (a) (dse a names)) app)
        (lambda (as)`(let ([,gx ,as]) ,(dse e1 ns/gx))))]
      [`(let ([,x ,e0]) ,e1)
       (define gi (gensym 'i))
       (define gx (gensym x))
       (define ns/gx (hash-set names x gx))
       (make-atomic
        (dse e0 names)
        (lambda (a)
          `(let ([,gx ((lambda (,gi) ,gi) ,a)]) ,(dse e1 ns/gx))))]
      [(? app? app)
       (define ga (gensym 'a))
       (make-multi-atomic
        (map (lambda (a) (dse a names)) app)
        (lambda (as) `(let ([,ga ,as]) ,ga)))]
      [else (dsa e names)]))
  (define (dsa a names)
    (match a
      [`(lambda (,x) ,e)
       (define gx (gensym x))
       (define ns/gx (hash-set names x gx))
       `(lambda (,gx) ,(dse e ns/gx))]
      [(? symbol? x) (hash-ref names x 'freevar)]))
  (dse e (hash)))

(define (eval-atomic ae rho sigma)
  (match ae
    [(? symbol? x) (hash-ref sigma (hash-ref rho x))]
    [`(lambda (,x) ,e)
     (set `(closure ,x ,e ,rho))]))

(define (alloc x varsig)
  x)

(define (allock varsig clo)
  (match-define `(closure ,x ,e ,rho) clo)
  `(,e ,rho))

(define (step-state varsig)
  (match varsig
    [`(eval (let ([,x (,f ,ae)]) ,e) ,rho ,sigma ,sigmak ,k)
     (for*/set ([f-clo (eval-atomic f rho sigma)])
       (let* ([d (eval-atomic ae rho sigma)]
              [k+ (allock varsig f-clo)]
              [sigmak+ (store-include sigmak k+ (set `((closure ,x ,e ,rho) ,k)))])
         `(apply ,f-clo ,d ,sigma ,sigmak+ ,k+)))]
    [`(eval ,_ ,_ ,_ ,_ halt) (set varsig)]
    [`(eval ,ae  ,rho ,sigma ,sigmak ,k)
     (for*/set ([k-frame (hash-ref sigmak k)])
       (define d (eval-atomic ae rho sigma))
       (match-define `(,clo ,k+) k-frame)
       `(apply ,clo ,d ,sigma ,sigmak ,k+))]
    [`(apply ,clo ,d ,sigma ,sigmak ,k)
     (match-define `(closure ,x ,e ,rho) clo)
     (for*/set ([_ `(once)]) 
       (let* ([a (alloc x varsig)]
              [rho+ (hash-set rho x a)]
              [sigma+ (store-include sigma a d)])
         `(eval ,e ,rho+ ,sigma+ ,sigmak ,k)))]))
       
(define (inject syntax)
  `(eval ,syntax ,(hash) ,(hash) ,(hash) halt))

(define (extract-stores varsig)
  (match-define `(,v ,a ,b ,s1 ,s2 ,k) varsig)
  `((,v ,a ,b ,k) ,s1 ,s2))

(define (inject-stores st s1 s2)
  (match-define `(,v ,a ,b ,k) st)
  `(,v ,a ,b ,s1 ,s2 ,k))

(define (explore fronteer complete sigma sigmak)
  (define next (set-first fronteer))
  (define c-new (set-add complete next))
  (define next/store (inject-stores next sigma sigmak))
  (match-define `(,f+ ,sigma-new ,sigmak-new)
    (foldl (lambda (new acc)
             (match-define `(,f ,s ,sk) acc)
             (match-define
               `(,st-new ,s-new ,sk-new)
               (extract-stores new))
             (let ([f+ (set-add f st-new)]
                   [s+ (store-union s s-new)]
                   [sk+ (store-union sk sk-new)])
               `(,f+ ,s+ ,sk+)))
           `(,(set-rest fronteer) ,sigma ,sigmak)
           (set->list (step-state next/store))))
  (define f-new (set-subtract f+ c-new))
  (if (and (equal? sigma sigma-new) (equal? sigmak sigmak-new))
      (if (set-empty? f-new)
          `(,c-new ,sigma-new ,sigmak-new)
          (explore f-new c-new sigma-new sigmak-new))
      (explore (set-union f-new c-new) (set) sigma-new sigmak-new)))      

(define (explore-syntax syntax)
  (define ds (desugar syntax))
  (display "explored expression:\n")(pretty-print ds)(display "\n")
  (match-define `(,st ,sigma ,sigmak) (extract-stores (inject ds)))
  (pretty-print (explore (set st) (set) sigma sigmak)))

(define (graph-syntax syntax state-gen kont-gen)
  (define ds (desugar syntax))
  (match-define `(,st ,sigma ,sigmak) (extract-stores (inject ds)))
  (match-define `(,states ,store ,kstore) (explore (set st) (set) sigma sigmak))
  (define state-ids (for/hash ([s states][id (range (set-count states))]) (values s id)))
  (define state-tran (for/hash ([s states])
                       (match-define st-tr (step-state (inject-stores s store kstore)))
                       (values (hash-ref state-ids s) (for/list ([tr st-tr])
                                                        (hash-ref state-ids (car (extract-stores tr)))))))
  (define labels (cons 'halt (hash-keys kstore)))
  (define label-ids (for/hash ([l labels][id (range (length labels))]) (values l id)))
  (define k-closures
    (list->set
     (set-map (apply set-union (hash-values kstore))
              (lambda(i) (match-define `(,c ,l) i) `(,c ,(hash-ref label-ids l))))))
  (define k-c-ids (for/hash ([k k-closures][id (range (set-count k-closures))]) (values (car k) id)))
  (define l-c-trans (for/hash ([l labels])
                        (define l-tr (hash-ref kstore l (set)))
                        (values (hash-ref label-ids l) (for/list ([tr l-tr])
                                                         (hash-ref k-c-ids (car tr))))))
  `(,(state-gen states state-ids state-tran) ,(kont-gen k-closures k-c-ids l-c-trans)))

(define (ex1) (explore-syntax `(let ([a ((lambda (x) (let ([a (x x)]) a))(lambda (x) (let ([a (x x)]) a)))]) a)))
(define (ex2) (explore-syntax `(let ([z ((lambda (y) y) (lambda (x) x))]) z)))
(define (ex3) (explore-syntax `((lambda (x) (x x))(lambda (x) (x x)))))
(define (ex4) (explore-syntax `(let ([a ((let ([b (x x)]) (let ([z b]) b)) (let ([c (z a)]) c))]) a)))
