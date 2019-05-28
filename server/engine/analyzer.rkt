#lang racket

(require json)
(require racket/hash)

(provide
 analyze
 analyze-syn
 regroup-by-call
 step-state
 loc-start
 loc-end
 get-li
 get-kappa
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
  (define loc (ast/loc-loc syn))
  (if (pair? loc)
      (car loc)
      (ast/loc-bound syn)))

(define (loc-end syn)
  (define loc (ast/loc-loc syn))
  (if (pair? loc)
      (cdr loc)
      loc))

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

(define (top-expr id>lambda)
  (define top (hash-ref id>lambda 'top))
  (define lam (ast/loc-ast top))
  (match lam [`(lambda ,_ ,e) e]))

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
  (hash-set! id>lambda 'top (ast/loc `(lambda () ,ast) 'top (ast/loc-loc ast) 'none))
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
  (hash-set! id>lambda 'top (ast/loc `(lambda () ,ast) 'top (ast/loc-loc ast) 'none))
  (list ast id>lambda))
  
(define (store-include store key values)
  (define old-val (hash-ref store key (set)))
  (define new-val (set-union old-val values))
  (hash-set store key new-val))

(define (print-explore result)
  (display "states:\n")
  (match-define `(,states ,sigma ,sigmak) result)
  (for ([s states]) (print-state s #f 0)(display "\n")))
  ;(display "store:\n")
  ;(pretty-print sigma)
  ;(display "k-store:\n")
  ;(pretty-print sigmak))

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
    [`(inner apply ,_ ,ds () ,i ,kappa)
     (display "(apply ")
     (print-list ((curry print-set) print-clo) ds #t ncol)
     (display " ")
     (print-kont kappa #t ncol)
     (display ")")]
    [`(inner let ,_ ,ds () ,i ,kappa)
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
  (define (look fronteer complete)
    (define next (set-first fronteer))
    (define complete+ (set-add complete next))
    (define fronteer+more
      (set-union (set-rest fronteer)
       (match next
         ['halt (set)]
         [(cons `(frame . ,_) _) (set)]
         [`(notfound ,_)(set)]
         [addr (hash-ref sigmak addr (set `(notfound addr)))])))
    (define fronteer+ (set-subtract fronteer+more complete+))
    (if (set-empty? fronteer+)
                    (foldl (lambda(k fs)
                             (match k
                               ['halt (set-add fs k)]
                               [(cons `(frame . ,_) _) (set-add fs k)]
                               [`(notfound ,_) (set-add fs k)]
                               [addr fs])) (set) (set->list complete+))
                    (look fronteer+ complete+)))
  (look (set kappa) (set)))

(define (atomic? ae)
  (match ae
    [(ast/loc `(lambda ,_ ,_) _ _ _) #t]
    [(ast/loc (? symbol? _) _ _ _) #t]
    [else #f]))

(define (tick i state) i)
(define (tick2 i fi state) fi)

(define (get-li state)
  (match state
    [(ast/loc _ _ _ l) (list l '())]
    [`(eval ,(ast/loc _ _ _ l) ,_ ,i ,_)(list l i)]
    [`(inner ,_ ,(ast/loc _ _ _ l) ,_ ,_ ,i ,_)(list l i)]
    [else (car state)]))

(define (get-kappa state)
  (match state
    [`(eval ,_ ,_ ,_ ,k) k]
    [`(inner ,_ ,_ ,_ ,_ ,_ ,k) k]
    [else (car state)]))

(define (step-state state sigma sigmak id>lambda)
  (match state
    [`(eval ,(ast/loc `(let ([,xs ,es]...) ,e_b) _ _ lid) ,rho ,i ,kappa)
     (define e (cadr state))
     (define new-i (tick i state))
     (define new-state
       `(eval ,(car es) ,rho ,new-i ,(cons `(frame let ,e (,(set `(clo ,xs ,e_b ,rho))) ,(cdr es) () ,rho ,new-i) kappa)))
     `(,(set new-state) ,sigma ,sigmak)]
    [`(eval ,(? atomic? ae) ,rho ,i ,kappa)
     (match (atomic ae rho sigma)
       ['notfound `(,(set `(notfound ,ae ,rho ,i ,kappa)) ,sigma ,sigmak)]
       [dn
        (define new-states
          (match kappa
            ['halt (set `(halt ,dn))]
            [(cons `(frame ,cat ,e ,ds ,es ,e0s ,rhok ,i+) kappa+)
             (define new-i (tick2 i i+ state))
             (if (empty? es)
                 (set `(inner ,cat ,e (,@ds ,dn) ,e0s ,new-i ,kappa+))
                 (set `(eval ,(car es) ,rhok ,new-i ,(cons `(frame ,cat ,e (,@ds ,dn) ,(cdr es) ,e0s ,rhok ,new-i) kappa+))))]
            [addr
             (for/set ([kont (hash-ref sigmak addr)])
               (define e+ (match kont
                            ['halt (top-expr id>lambda)]
                            [(cons `(frame ,_ ,e . ,_) _) e]
                            [addr (car addr)]))
               `(inner return ,e+ ,dn () ,(tick i state) ,kont))]))
        `(,new-states ,sigma ,sigmak)])]
    [`(eval ,(ast/loc `(,e0 . ,es) _ _ _) ,rho ,i ,kappa)
     (define e (cadr state))
     (define new-i (tick i state))
     (define new-state
       `(eval ,e0 ,rho ,new-i ,(cons `(frame apply ,e () ,es () ,rho ,new-i) kappa)))
     `(,(set new-state) ,sigma ,sigmak)]
    [`(inner return ,ae ,d ,_ ,i ,kappa)
     (define new-states
       (match kappa
         ['halt (set `(halt ,d))]
         [(cons `(frame ,cat ,e ,ds ,es ,e0s ,rhok ,i+) kappa+)
          (define new-i (tick2 i i+ state))
          (if (empty? es)
              (set `(inner ,cat ,e (,@ds ,d) ,e0s ,new-i ,kappa+))
              (set `(eval ,(car es) ,rhok ,new-i ,(cons `(frame ,cat ,e (,@ds ,d) ,(cdr es) ,e0s ,rhok ,new-i) kappa+))))]
         [addr
          (for/set ([kont (hash-ref sigmak addr)])
            (define e+ (match kont
                            ['halt (top-expr id>lambda)]
                            [(cons `(frame ,_ ,e . ,_) _) e]
                            [addr (car addr)]))
            `(inner return ,e+ ,d () ,(tick i state) ,kont))]))
     `(,new-states ,sigma ,sigmak)]
    [`(inner let ,_ (,d . ,ds) () ,i ,kappa)
     (match-define `(clo ,xs ,e ,rho) (set-first d))
     (define i+ (tick i state))
     (define ais (map (lambda (xi) (list xi i+)) xs))
     (define rho+
       (foldl (lambda (xi ai r)
                (hash-set r xi ai))
              rho
              xs ais))
     (define sigma-new
       (foldl (lambda (ai di s)
                (store-include s ai di))
              sigma
              ais ds))
     `(,(set `(eval ,e ,rho+ ,i+ ,kappa)) ,sigma-new ,sigmak)]
    [`(inner apply ,_ (,d . ,ds) () ,i ,kappa)
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
    [else `(,(set) ,sigma ,sigmak)]))

(define (explore-state init id>lambda)
  (define (explore fronteer complete sigma sigmak)
    (define next (set-first fronteer))
    ;(pretty-print next)(display "\n")
    (define c-new (set-add complete next))
    (match-define `(,states-new ,sigma-new ,sigmak-new) (step-state next sigma sigmak id>lambda))
    (define f+ (set-union (set-rest fronteer) states-new))
    (define f-new (set-subtract f+ c-new))
    (if (and (equal? sigma sigma-new) (equal? sigmak sigmak-new))
        (if (set-empty? f-new)
            `(,c-new ,sigma-new ,sigmak-new)
            (explore f-new c-new sigma-new sigmak-new))
        (explore (set init) (set) sigma-new sigmak-new)))
  (explore (set init)(set)(hash)(hash)))

(define (regroup-by-call init states data-tables)
  (match-define (list id>lambda sigma sigmak) data-tables)
  (define state>state-trans (for/hash ([s states])
                              (match-define (list trans _ _) (step-state s sigma sigmak id>lambda))
                              (values s trans)))
  (define all-calls
    (foldl (lambda (s calls)
             (match s
               [`(inner apply . ,_)
                (foldl (lambda(t c)
                         (match t
                           [`(eval ,(ast/loc _ _ _ l) ,_ ,i ,_)
                            (store-include c (list l i)(set t))]
                           [else c]))
                       calls (set->list (hash-ref state>state-trans s)))]
               [else calls]))
           (hash (get-li init) (set init))
           (set->list states)))
  (define all-returns
    (foldl (lambda (s returns)
             (match s
               [(or
                 `(eval ,(? atomic? _) ,_ ,_ ,k)
                 `(inner return ,_ ,_ ,_ ,_ ,k))
                (store-include returns k (hash-ref state>state-trans s))]
               [else returns]))
           (hash)
           (set->list states)))
  (define (make-subgraph li)
    (define calls (mutable-set))
    (define returns (mutable-set))
    (define finals (mutable-set))
    (define (s->trans s) (hash-ref state>state-trans s (set)))
    (define init (hash-ref all-calls li))
    (define (build-graph fronteer trans)
      (define next (set-first fronteer))
      (define next-trans
        (match next
          [(? set? (not (? set-empty?)))
           (define next-states (apply set-union (set-map next s->trans)))
           (match (set-first next)
             [(or
               `(eval ,(? atomic?) ,_ ,_ ,(not `((frame . ,_) . ,_)))
               `(inner return ,_ ,_ ,_ ,_ ,(not `((frame . ,_) . ,_))))
              (make-immutable-hash
               (set-map next-states
                        (lambda (state)
                          (define li (get-li state))
                          (match li
                            [(list _ _)
                             (set-add! returns li)
                             (cons `(exit ,li) `(return-out, li))]
                            ['halt
                             (set-add! finals state)
                             (cons state `(halt))]
                            [else
                             (set-add! finals state)
                             (cons state `(stuck))]))))]
             [`(inner apply . ,_)
              (match-define (list stop go)
                (foldl (lambda(s rs)
                         (match-define (list stop go) rs)
                         (define li (get-li s))
                         (define k (get-kappa s))
                         (match li
                           [(list _ _)
                            (set-add! calls li)
                            (define returns (hash-ref all-returns k (set)))
                            (if (set-empty? returns)
                                (list (set-add stop
                                               (cons `(no-return ,li) `(call-out, li))) go)
                                (list stop (cons
                                            (set-union returns (car go))
                                            (set-union (set li) (cdr go)))))]
                           [else
                            (set-add! finals s)
                            (list (set-add stop (cons s `(stuck))) go)]))
                       (list (set) (cons (set)(set)))
                       (set->list next-states)))
              (if (set-empty? (car go))
                  (make-immutable-hash (set->list stop))
                  (make-immutable-hash (cons (cons (car go) `(call-return ,(cdr go)))
                                             (set->list stop))))]
             [else (hash next-states `(step))])]
          [else (hash)]))
      (define fronteer+ (set-union (set-rest fronteer) (list->set (hash-keys next-trans))))
      (define trans+ (hash-set trans next next-trans))
      (if (set-empty? fronteer+)
          trans+
          (build-graph fronteer+ trans+)))
    (define trans (build-graph (set init) (hash))) 
    (list init trans calls returns finals))
  (cons (get-li init)
          (foldl (lambda(c t)
                   (match-define (list trans subs) t)
                   (match-define (list s-init s-trans calls returns finals) (make-subgraph c))
                   (define new-trans
                     (hash-union
                      (for/hash ([c calls])
                        (values c `(call)))
                      (for/hash ([r returns])
                        (values r `(return)))
                      (for/hash ([f finals])
                        (values f `(stop)))
                      #:combine (lambda(a b) `(call-and-return))))
                   (define trans+
                     (hash-union (hash-set trans c new-trans) (for/hash ([f finals])
                                                                (values f (hash)))
                                 #:combine (lambda(a b)a)))
                   (define subs+ (hash-set subs c (list s-init s-trans)))
                   (list trans+ subs+))
                 (list (hash)(hash))
                 (hash-keys all-calls))))

(define (inject data)
  (match-define `(,ast ,ids) (build-ast data))
  (list `(eval ,ast ,(hash) () halt) ids))

(define (analyze json-ast start-token)
  (match-define `(,ast ,id>lambda) (make-ast json-ast (string->symbol start-token)))
  (define init `(eval ,ast ,(hash) () halt))
  (match-define `(,states ,sigma ,sigmak) (explore-state init id>lambda))
  (list init states (list id>lambda sigma sigmak)))

(define (analyze-syn syn)
  (match-define `(,init ,id>lambda)(inject syn))
  (match-define `(,states ,sigma ,sigmak) (explore-state init id>lambda))
  (list init states (list id>lambda sigma sigmak)))

(define (explore data)
  (display "explored expression:\n")(show-syntax data)(display "\n")
  (match-define `(,initial-state ,id>lambda)(inject data))
  (define sg-results (explore-state initial-state id>lambda))
  (match-define (list states sigma sigmak) sg-results)
  (define tables (list id>lambda sigma sigmak))
  (match-define (list calls returns subs) (regroup-by-call initial-state states tables))
  (print-explore sg-results)
  (display "\ncalls:\n")
  (pretty-print calls)
  (display "\nreturns:\n")
  (pretty-print returns))
  ;(display "\nsubs:\n")
  ;(pretty-print subs))

(define (ex1) (explore `(let ([z ((lambda (y) y) (lambda (x) x))]) z)))
(define (ex2) (explore `(let ([a ((lambda (x) (let ([a (x x)]) a))(lambda (x) (let ([a (x x)]) a)))]) a)))
(define (ex3) (explore `((lambda (x) (x x))(lambda (x) (x x)))))
(define (ex5) (explore `((((lambda (x) (lambda (y) (lambda (z) (((x x) y) z))))(lambda (a) (lambda (b) (lambda (c) (((b a) b) c)))))(lambda (a) (lambda (b) (lambda (c) (((c a) b) c)))))(lambda (a) (lambda (b) (lambda (c) (((a a) b) c)))))))
(define (ex6) (explore `((lambda (x y z) (x x y z))(lambda (a b c) (b a b c))(lambda (a b c) (c a b c))(lambda (a b c) (a a b c)))))
;stuck states: free vars
(define (ex4) (explore `(let ([a ((let ([b (x x)]) (let ([z b]) b)) (let ([c (z a)]) c))]) a)))
