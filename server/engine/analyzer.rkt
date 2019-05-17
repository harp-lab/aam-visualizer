#lang racket

(require json)

(provide
 analyze
 step-state
 divide-kont
 loc-start
 loc-end
 only-syntax)

(define newsym_counter 0)
(define (newsym s)
  (set! newsym_counter (+ 1 newsym_counter))
  (string->symbol (format "~a~a" s newsym_counter)))

(define (get-json in-file)
  (define in (open-input-file in-file))
  (define out (read-json in))
  (close-input-port in)
  out)

;(pretty-print (get-json "parseoutput.json"))

(define (show-syntax data)
  (match data
    [(? string? s)
     (define json (get-json s))
     (pretty-print (hash-ref json 'code))]
    [else (pretty-print data)]))

(define (build-ast in)
  (match in
    [(? string? s)
     (define json (hash-ref (get-json s) 'ast))
     (make-ast (hash-ref json 'graph) (string->symbol (hash-ref json 'start)))]
    [else (syntax->ast in)]))

(struct ast/loc (ast bound loc lambda-id)  #:transparent)

(define (loc-start syn)
  (car (ast/loc-loc syn)))

(define (loc-end syn)
  (cdr (ast/loc-loc syn)))

(define (only-syntax ast)
  (define syn-ast (ast/loc-ast ast))
  (define (conv-list l)
    (map (lambda (i)
           (match i
             [(? ast/loc? i) (only-syntax i)]
             [(? list? l+)(conv-list l+)]
             [else i])) l))  
  (if (list? syn-ast)
      (conv-list syn-ast)
      syn-ast))

(define (get-loc item)
  (define start (hash-ref item 'start `(0 0)))
  (define end (hash-ref item 'end `(0 0)))
  (cons start end))

(define (get-symbol item)
  (string->symbol (hash-ref item 'tok)))

(define (get-parts item)
  (map (lambda (i) (get-symbol i)) (hash-ref item 's-expr)))

(define (make-ast jast start)
  (define id>lambda (make-hash))
  (define (json->ast jast start bindings last-lam-id [next-lam #f])
    (define item (hash-ref jast start))
    (match (symbol->string start)
      [(regexp #rx"a")
       (define symb (get-symbol item))
       (ast/loc symb (hash-ref bindings symb 'free) (get-loc item) last-lam-id)]
      [_
       (define parts (get-parts item))
       (define (make-apply)
         (ast/loc (map (lambda (id)
                         (json->ast jast id bindings last-lam-id)) parts) 'apply (get-loc item) last-lam-id))
       (match (symbol->string (car parts))
         [(regexp #rx"a")
          (match (get-symbol (hash-ref jast (car parts)))
            ['lambda
             (define params (get-parts (hash-ref jast (cadr parts))))
             (define xs (map (lambda (p) (json->ast jast p (hash) last-lam-id)) params))
             (define bindings-new
               (foldl (lambda (xi bs) (hash-set bs (ast/loc-ast xi) xi)) bindings xs))
             (define this-lam-id (or next-lam (newsym 'func)))
             (define aste (json->ast jast (caddr parts) bindings-new this-lam-id))
             (define this-lam (ast/loc `(lambda ,xs ,aste) 'lambda (get-loc item) last-lam-id))
             (hash-set! id>lambda this-lam-id this-lam)
             this-lam]
            ['let
             (define binds (get-parts (hash-ref jast (cadr parts))))
             (match-define (cons pairs bindings-new)
               (foldr (lambda (id acc)
                        (match-define (cons ps bs) acc)
                        (define jp (get-parts (hash-ref jast id)))
                        (define xi (json->ast jast (car jp) bindings last-lam-id))
                        (define ei (json->ast jast (cadr jp) bindings last-lam-id (ast/loc-ast xi)))
                        (define bs+ (hash-set bs (ast/loc-ast xi) xi))
                        (define ps+ (cons (list xi ei) ps))
                        (cons ps+ bs+))
                      (cons '() bindings)
                      binds))
             (define aste (json->ast jast (caddr parts) bindings-new last-lam-id))
             (ast/loc `(let ,pairs ,aste) 'let (get-loc item) last-lam-id)]
            ['begin
             (json->ast jast (last parts) bindings last-lam-id)]
            [var (make-apply)])]
         ["begin"
          (json->ast jast (last parts) bindings last-lam-id)]
         [_
          (make-apply)])]))
  (define ast (json->ast jast start (hash) 'top))
  (list ast id>lambda))
  

(define (syntax->ast syntax)
  (define id>lambda (make-hash))
  (define (syntax->ast syntax bindings last-lam-id [next-lam-id #f])
    (match syntax
      [`(let ([,xs ,es]...) ,e_b)
       (match-define (cons pairs bindings-new)
         (foldr (lambda (xi ei acc)
                  (match-define (cons ps bs) acc)
                  (define astx (syntax->ast xi (hash) last-lam-id))
                  (define aste (syntax->ast ei bindings last-lam-id (ast/loc-ast astx)))
                  (define ps+ (cons (list astx aste) ps))
                  (define bs+ (hash-set bs xi astx))
                  (cons ps+ bs+))
                (cons '() bindings)
                xs es))
       (define astb (syntax->ast e_b bindings-new last-lam-id))
       (ast/loc `(let ,pairs ,astb) 'let (gensym 'let) last-lam-id)]
      [(? symbol? x) (ast/loc x (hash-ref bindings x 'free) (gensym x) last-lam-id)]
      [`(lambda ,xs ,e)
       (match-define (cons vars bindings-new)
         (foldr (lambda (xi acc)
                  (match-define (cons vs bs) acc)
                  (define astx (syntax->ast xi (hash) last-lam-id))
                  (define vs+ (cons astx vs))
                  (define bs+ (hash-set bs xi astx))
                  (cons vs+ bs+))
                (cons '() bindings)
                xs))
       (define this-lam-id (or next-lam-id (newsym 'func)))
       (define aste (syntax->ast e bindings-new this-lam-id))
       (define this-lam (ast/loc `(lambda ,vars ,aste) 'lambda (gensym 'lambda) last-lam-id))
       (hash-set! id>lambda this-lam-id this-lam)
       this-lam]
      [(? list? es)
       (ast/loc (map (lambda (ei) (syntax->ast ei bindings last-lam-id)) es) 'apply (gensym 'apply) last-lam-id)]))
  (define ast (syntax->ast syntax (hash) 'top))
  (list ast id>lambda))
  
(define (store-include store key values)
  (define old-val (hash-ref store key (set)))
  (define new-val (set-union old-val values))
  (hash-set store key new-val))

(define (print-explore result)
  (match-define `(,states ,sigma ,sigmak) result)
  (for ([s states]) (print-state s #f 0)(display "\n"))
  (pretty-print sigma)
  (pretty-print sigmak))

(define (print-clo v inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (match-define `(clo ,xs ,e ,rho) v)
  (display "(clo ")
  (print-env rho #t ncol)
  (display " ")
  (print-list print-var xs #t ncol)
  (display " ")
  (print-exp 0 e #t ncol)
  (display ")"))

(define (print-var v inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (display (ast/loc-ast v)))
  
(define (print-env e inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (display "Env"))

(define (print-kont k inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (display "Kont"))

(define (print-bind b inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (match-define (list x exp) b)
  (display "[")
  (print-var x #t ncol)
  (display " ")
  (print-exp 1 exp #t ncol)
  (display "]"))

(define (print-exp size e inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (match e
    [(ast/loc `(let ,bs ,e) _ _ _)
     (display "(let ")
     (print-list print-bind bs #t ncol)
     (display " ")
     (print-exp 2 e #t ncol)
     (display ")")]
    [(ast/loc `(lambda ,xs ,e) _ _ _)
     (display "(lambda ")
     (print-list print-var xs #t ncol)
     (display " ")
     (print-exp 0 e #t ncol)
     (display ")")]
    [(ast/loc (? symbol? x) _ _ _)(display x)]
    [(ast/loc (? list? es) _ _ _)
     (print-list ((curry print-exp) 0) es #t ncol)]))

(define (print-set print-val s inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (match (set-count s)
    [0 (display "{}")]
    [1 (display "{")(print-val (set-first s) #t ncol)(display "}")]
    [more
     (display (if inline "\n" ""))
     (for ([t col])(display "  "))
     (display " {")(print-val (set-first s) #t ncol)
     (for ([v (set-rest s)])
       (display "\n")(print-val v #f ncol))
     (display "}")]))

(define (print-list print-val l inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (match (length l)
    [0 (display "()")]
    [1 (display "(")(print-val (car l) #t ncol)(display ")")]
    [more
     (display (if inline "\n" ""))
     (for ([t col])(display "  "))
     (display " (")(print-val (car l) #t ncol)
     (for ([v (cdr l)])
       (display "\n")(print-val v #f ncol))
     (display ")")]))

(define (print-state val inline col)
  (define ncol (+ 1 col))
  (for ([t (if inline 0 col)])(display "  "))
  (match val
    [`(eval ,syn ,rho ,i ,kappa)
     (display "(eval ")
     (print-exp 0 syn #t ncol)
     (display " ")
     (print-env rho #t ncol)
     (display " ")
     (print-kont kappa #t ncol)
     (display ")")]
    [`(proc apply ,ds () ,i ,kappa)
     (display "(apply ")
     (print-list ((curry print-set) print-clo) ds #t ncol)
     (display " ")
     (print-kont kappa #t ncol)
     (display ")")]
    [`(proc let ,ds () ,i ,kappa)
     (display "(let ")
     (print-list ((curry print-set) print-clo) ds #t ncol)
     (display " ")
     (print-kont kappa #t ncol)
     (display ")")]
    [`(notfound ,ae ,rho ,i ,kappa)
     (display "(not-found)")]
    [`(notfound-k ,i ,kappa)
     (display "(not-found)")]
    [`(halt ,d ,rho)
     (display "(halt ")
     (print-set print-clo d #t ncol)
     (display " ")
     (print-env rho #t ncol)
     (display ")")]))

(define (atomic ae rho sigma)
  (match ae
    [(ast/loc (? symbol? x) b _ _) (hash-ref sigma (hash-ref rho b 'notfound) 'notfound)]
    [(ast/loc `(lambda ,xs ,e) _ _ _)
     (set `(clo ,xs ,e ,rho))]))

(define (lookupk kappa sigmak)
  (match kappa
    ['halt (set 'halt)]
    [(cons `(frame . ,_) _)(set kappa)]
    [else (match (hash-ref sigmak kappa 'notfound)
            ['notfound (set 'notfound)]
            [ks
             (foldl (lambda (k fs) (set-union fs (lookupk k sigmak)))
                    (set)
                    (set->list ks))])]))

(define (atomic? ae)
  (match ae
    [(ast/loc `(lambda ,_ ,_) _ _ _) #t]
    [(ast/loc (? symbol? _) _ _ _) #t]
    [else #f]))

(define (tick i state) i)
(define (tick2 i fi state) fi) 

(define (step-state state sigma sigmak)
  (match state
    [`(eval ,(ast/loc `(let ([,xs ,es]...) ,e_b) _ _ lid) ,rho ,i ,kappa)
     (define new-i (tick i state))
     (define new-state
       `(eval ,(car es) ,rho ,new-i ,(cons `(frame let (,(set `(clo ,xs ,e_b ,rho))) ,(cdr es) () ,lid ,rho ,new-i) kappa)))
     `(,(set new-state) ,sigma ,sigmak)]
    [`(eval ,(? atomic? ae) ,rho ,i ,kappa)
     (match (atomic ae rho sigma)
       ['notfound `(,(set `(notfound ,ae ,rho ,i ,kappa)) ,sigma ,sigmak)]
       [dn
        (define new-states
          (for/set ([kont (lookupk kappa sigmak)])
            (match kont
              ['halt `(halt ,dn ,rho)]
              ['notfound `(notfound-k ,i ,kappa)]
              [(cons `(frame ,cat ,ds ,es ,e0s ,lid ,rhok ,i+) kappa+)
               (define new-i (tick2 i i+ state))
               (if (empty? es)
                   `(proc ,cat (,@ds ,dn) ,e0s ,new-i ,kappa+)
                   `(eval ,(car es) ,rhok ,new-i ,(cons `(frame ,cat (,@ds ,dn) ,(cdr es) ,e0s ,lid ,rhok ,new-i) kappa+)))])))
        `(,new-states ,sigma ,sigmak)])]
    [`(eval ,(ast/loc `(,e0 . ,es) _ _ lid) ,rho ,i ,kappa)
     (define new-i (tick i state))
     (define new-state
       `(eval ,e0 ,rho ,new-i ,(cons `(frame apply () ,es () ,lid ,rho ,new-i) kappa)))
     `(,(set new-state) ,sigma ,sigmak)]
    [`(proc ,(or 'apply 'let) (,d . ,ds) () ,i ,kappa)
       (foldl (lambda (clo acc)
                (match-define `(,states ,sigma+ ,sigmak+) acc)
                (match-define `(clo ,xs ,e ,rho) clo)
                (define i+ (tick i state))
                (define ais (map (lambda (xi) (list xi i+)) xs))
                (define rho+ (foldl (lambda (xi ai r)
                                      (hash-set r xi ai))
                                    rho
                                    xs ais))
                (define sigma-new (foldl (lambda (ai di s)
                                       (store-include s ai di))
                                     sigma+
                                     ais ds))
                (define ak `(,e ,rho+))
                (define sigmak-new (store-include sigmak+ ak (set kappa)))
                `(,(set-add states `(eval ,e ,rho+ ,i+ ,ak)) ,sigma-new ,sigmak-new))
              `(,(set) ,sigma ,sigmak)
              (set->list d))]
    [else `(,(set state) ,sigma ,sigmak)]))

(define (explore-state fronteer complete sigma sigmak)
  (define next (set-first fronteer))
  ;(pretty-print next)(display "\n")
  (define c-new (set-add complete next))
  (match-define `(,states-new ,sigma-new ,sigmak-new) (step-state next sigma sigmak))
  (define f+ (set-union (set-rest fronteer) states-new))
  (define f-new (set-subtract f+ c-new))
  (if (and (equal? sigma sigma-new) (equal? sigmak sigmak-new))
      (if (set-empty? f-new)
          `(,c-new ,sigma-new ,sigmak-new)
          (explore-state f-new c-new sigma-new sigmak-new))
      (explore-state (set-union f-new c-new) (set) sigma-new sigmak-new)))

(define (regroup-by-call init states data-tables)
  (match-define (list id>lambda sigma sigmak) data-tables)
  (define state>sid (for/hash ([s states][id (range (set-count states))]) (values s id)))
  (define sid>state (for/hash ([s states][id (range (set-count states))]) (values id s)))
  (define state>state-trans (for/hash ([s states])
                              (match-define (list st-tr _ _) (step-state s sigma sigmak))
                              (values s st-tr)))
  (define lri>states (foldl (lambda (s l>s)
                              (match s
                                [`(eval ,(ast/loc _ _ _ l) ,r ,i ,_) (store-include l>s (list l r i) s)]
                                [else l>s]))
                            (hash)
                            states))
  (define lri>returns
    (foldl (lambda (s l>r)
             (match s
               [`(eval ,(? atomic? ae) ,rho ,i ,kappa)
                (match (atomic ae rho sigma)
                  [dn (foldl (lambda (k l>r)
                               (match k
                                 [(cons `(frame ,cat ,ds () ,e0s ,lid ,rhok ,i+) kappa+)
                                  (store-include l>r (list lid rhok i+)
                                                 (list k `(proc ,cat (,@ds ,dn) ,e0s (tick2 i i+ s) ,kappa+)))]
                                 [(cons `(frame ,cat ,ds ,es ,e0s ,lid ,rhok ,i+) kappa+)
                                  (define new-i (tick2 i i+ s))
                                  (store-include l>r (list lid rhok i+)
                                                 (list k `(eval ,(car es) ,rhok ,new-i ,(cons `(frame ,cat (,@ds ,dn) ,(cdr es) ,e0s ,lid ,rhok ,new-i) kappa+))))]
                                 [else l>r]))
                             l>r (lookupk kappa sigmak))]
                  [else l>r])]
               [else l>r]))
           (hash) states))
  (define subgraphs (make-hash))
  (define (make-subgraph body-state)
    (match-define `(eval ,(ast/loc _ _ _ lid) ,rho ,i ,k) body-state)
    (define include-states (hash-ref lri>states (list lid rho i)))
    (define return-states (hash-ref lri>returns (list lid rho i)))
    (define (follow-state f c trans out-trans calls returns)
      (define s (set-first f))
      (define c+ (set-add c s))
      (define s-out (match s
                      [`(proc apply (,cs . ,_) ,_ ,ia ,ka)
                       (for/set ([c cs])
                         (match-define `(clo ,xs ,ec ,rhoc) c)
                         'todo-search-returns)]
                      ['to 'do]
                      [else 'todo-get-trans-check-exiting]))
      (define f+ (set-subtract (set-union trans (set-rest f)) c+))
      (define trans+ 'todo)
      (define out-trans+ 'todo)
      (define calls+ 'todo)
      (define returns+ 'todo)
      (if (set-empty? f+)
          'todo-add-unconnected ;(list trans+ out-trans+ calls+ returns+)
          (follow-state f+ c+ trans+ out-trans+ calls+ returns+)))
    (follow-state (set body-state)(set)(hash)(hash)(set)(set)))
  'todo-save-sub-make-main)
  
(define (inject data)
  (match-define `(,ast ,ids) (build-ast data))
  (list `(eval ,ast ,(hash) () halt) ids))

(define (divide-kont k)
  (match k
    [(cons `(frame . ,_) rest)
     (match-define `(,f ,a) (divide-kont rest))
      `(,(cons (car k) f) ,a)]
    [else `((),k)]))

(define (analyze json-ast start-token)
  (match-define `(,ast ,id>lambda) (make-ast json-ast (string->symbol start-token)))
  (define init `(eval ,ast ,(hash) () halt))
  (match-define `(,states ,sigma ,sigmak) (explore-state (set init) (set) (hash) (hash)))
  (list init states (list id>lambda sigma sigmak)))

(define (explore data)
  (display "explored expression:\n")(show-syntax data)(display "\n")
  (match-define `(,ast ,id>lambda)(inject data))
  (define results (explore-state (set ast) (set) (hash) (hash)))
  (print-explore results))
  ;(void))

(define (ex1) (explore `(let ([a ((lambda (x) (let ([a (x x)]) a))(lambda (x) (let ([a (x x)]) a)))]) a)))
(define (ex2) (explore `(let ([z ((lambda (y) y) (lambda (x) x))]) z)))
(define (ex3) (explore `((lambda (x) (x x))(lambda (x) (x x)))))
(define (ex5) (explore `((((lambda (x) (lambda (y) (lambda (z) (((x x) y) z))))(lambda (a) (lambda (b) (lambda (c) (((b a) b) c)))))(lambda (a) (lambda (b) (lambda (c) (((c a) b) c)))))(lambda (a) (lambda (b) (lambda (c) (((a a) b) c)))))))
(define (ex6) (explore `((lambda (x y z) (x x y z))(lambda (a b c) (b a b c))(lambda (a b c) (c a b c))(lambda (a b c) (a a b c)))))
;stuck states: free vars
(define (ex4) (explore `(let ([a ((let ([b (x x)]) (let ([z b]) b)) (let ([c (z a)]) c))]) a)))
;from json
(define (ex7) (explore "parseoutput.json"))

