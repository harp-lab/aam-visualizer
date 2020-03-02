#lang racket

(require json)
(require racket/hash)

(provide
 analyze
 analyze-syn
 regroup-by-call
 step-state
 ast-id
 func-id
 atomic
 atomic?
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

(define (ast-id ast) (~a (ast/loc-loc ast)))
(define (func-id ast id>lambda) (~a (ast/loc-loc (hash-ref id>lambda (ast/loc-lambda-id ast)))))

(define (only-syntax ast)
  (match ast
    [(ast/loc syn-ast _ _ _)
     (define (conv-list l)
       (map (lambda (i)
              (match i
                [(? ast/loc? i) (only-syntax i)]
                [(? list? l+)(conv-list l+)]
                [else i])) l))  
     (if (list? syn-ast)
         (conv-list syn-ast)
         syn-ast)]
    [`(eval ,ast . ,_) (only-syntax ast)]
    [`(inner ,_ ,ast . ,_) (only-syntax ast)]
    [`(,form . ,_) form]))

(define (lbody id>lambda lid)
  (define lam (hash-ref id>lambda lid))
  (define lam-expr (ast/loc-ast lam))
  (match lam-expr [`(lambda ,_ ,e) e]))

(define (get-symbol item)
  (string->symbol (hash-ref item 'tok)))

(define (get-parts item)
  (map string->symbol (hash-ref item 's-expr)))

(define (make-ast jast start)
  (define id>lambda (make-hash))
  (define (json->ast jast start bindings last-lam-id [next-lam #f])
    (define item (hash-ref jast start))
    (match (symbol->string start)
      [(regexp #rx"a")
       (define symb (get-symbol item))
       (ast/loc symb (hash-ref bindings symb 'free) start last-lam-id)]
      [_
       (define parts (get-parts item))
       (define (make-apply)
         (ast/loc (map (lambda (id)
                         (json->ast jast id bindings last-lam-id)) parts) 'apply start last-lam-id))
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
             (define this-lam (ast/loc `(lambda ,xs ,aste) 'lambda start last-lam-id))
             (hash-set! id>lambda this-lam-id this-lam)
             this-lam]
            ['if
             (define guard (json->ast jast (cadr parts) bindings last-lam-id))
             (define caset (json->ast jast (caddr parts) bindings last-lam-id))
             (define casef (json->ast jast (cadddr parts) bindings last-lam-id))
             (ast/loc `(if ,guard ,caset ,casef) 'if start last-lam-id)]
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
             (ast/loc `(let ,pairs ,aste) 'let start last-lam-id)]
            ['begin
             (json->ast jast (last parts) bindings last-lam-id)]
            [var (make-apply)])]
         ["begin"
          (json->ast jast (last parts) bindings last-lam-id)]
         [_
          (make-apply)])]))
  (define ast (json->ast jast start (hash) 'main))
  (hash-set! id>lambda 'main (ast/loc `(lambda () ,ast) 'main (ast/loc-loc ast) 'none))
  (list ast id>lambda))
  

(define (syntax->ast syntax)
  (define id>lambda (make-hash))
  (define (syntax->ast syntax bindings last-lam-id [next-lam-id #f])
    (match syntax
      [#t (ast/loc '|#t| '|#t| (gensym '|#t|) last-lam-id)]
      [#f (ast/loc '|#f| '|#f| (gensym '|#f|) last-lam-id)]
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
      [`(if ,g ,t ,f)
       (define guard (syntax->ast g bindings last-lam-id))
       (define caset (syntax->ast t bindings last-lam-id))
       (define casef (syntax->ast f bindings last-lam-id))
       (ast/loc `(if ,guard ,caset ,casef) 'if (gensym 'if) last-lam-id)]
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
  (define ast (syntax->ast syntax (hash) 'main))
  (hash-set! id>lambda 'main (ast/loc `(lambda () ,ast) 'main (ast/loc-loc ast) 'none))
  (list ast id>lambda))
  
(define (store-include store key values)
  (define old-val (hash-ref store key (set)))
  (define new-val (set-union old-val values))
  (hash-set store key new-val))

(define (atomic ae rho sigma)
  (match ae
    [(ast/loc '|#f| _ _ _) (set #f)]
    [(ast/loc '|#t| _ _ _) (set #t)]
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
    [(ast/loc '|#t| _ _ _) #t]
    [(ast/loc '|#f| _ _ _) #t]
    [(ast/loc `(lambda ,_ ,_) _ _ _) #t]
    [(ast/loc (? symbol? _) _ _ _) #t]
    [else #f]))

(define (cfa count)
  (define (tick i lid state)
    (define size (min count (+ 1 (length i))))
    (match state
      [`(eval ,(ast/loc `(let . ,_) _ _ _) . ,_) i]
      [`(eval ,(ast/loc `(if . ,_) _ _ _) . ,_) i]
      [`(eval ,(? atomic?) . ,_) i]
      [`(eval ,(ast/loc `(,e0 . ,_) _ _ _) . ,_) (take (cons (cadr state) i) size)]
      [else i]))
  (define (tick2 i fi state) (cons fi fi))
  (list tick tick2))

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

(define (step-state state sigma sigmak instr id>lambda)
  (match-define (list tick tick2) instr)
  (match state
    [`(eval ,(ast/loc `(let ([,xs ,es]...) ,e_b) _ _ lid) ,rho ,i ,kappa)
     (define e (cadr state))
     (define new-i (tick i lid state))
     (define new-state
       `(eval ,(car es) ,rho ,new-i ,(cons `(frame let ,e (,(set `(clo ,xs ,e_b ,rho))) ,(cdr es) () ,rho ,new-i) kappa)))
     `(,(set new-state) ,sigma ,sigmak)]
    [`(eval ,(ast/loc `(if ,g ,t ,f) _ _ lid) ,rho ,i ,kappa)
     (define e (cadr state))
     (define new-i (tick i lid state))
     (define new-state
       `(eval ,g ,rho ,new-i ,(cons `(frame if ,e () () (,t ,f ,rho) ,rho ,new-i) kappa)))
     `(,(set new-state) ,sigma ,sigmak)]
    [`(eval ,(? atomic? ae) ,rho ,i ,kappa)
     (match (atomic ae rho sigma)
       ['notfound `(,(set `(notfound ,ae ,rho ,i ,kappa)) ,sigma ,sigmak)]
       [dn
        (define new-states
          (match kappa
            ['halt (set `(halt ,dn, rho))]
            [(cons `(frame ,cat ,e ,ds ,es ,e0s ,rhok ,i+) kappa+)
             (match-define (cons new-i new-fi) (tick2 i i+ state))
             (if (empty? es)
                 (set `(inner ,cat ,e (,@ds ,dn) ,e0s ,new-i ,kappa+))
                 (set `(eval ,(car es) ,rhok ,new-i ,(cons `(frame ,cat ,e (,@ds ,dn) ,(cdr es) ,e0s ,rhok ,new-fi) kappa+))))]
            [addr
             (for/set ([kont (hash-ref sigmak addr)])
               (match-define (list lid e+ i+)
                 (match kont
                   ['halt (list 'main (lbody id>lambda 'main) '())]
                   [(cons `(frame ,_ ,e ,_ ,_ ,_ ,_ ,fi) _) (list (ast/loc-lambda-id e) e fi)]
                   [addr
                    (define lid (car addr))
                    (list lid (lbody id>lambda lid) i)]))
               `(inner return ,e+ ,dn (,rho) ,i+ ,kont))]))
        `(,new-states ,sigma ,sigmak)])]
    [`(eval ,(ast/loc `(,e0 . ,es) _ _ l) ,rho ,i ,kappa)
     (define e (cadr state))
     (define new-i (tick i l state))
     (define new-state
       `(eval ,e0 ,rho ,new-i ,(cons `(frame apply ,e () ,es () ,rho ,new-i) kappa)))
     `(,(set new-state) ,sigma ,sigmak)]
    [`(inner return ,ae ,d (,rho . ,_) ,i ,kappa)
     (define new-states
       (match kappa
         ['halt (set `(halt ,d ,rho))]
         [(cons `(frame ,cat ,e ,ds ,es ,e0s ,rhok ,i+) kappa+)
          (match-define (cons new-i new-fi) (tick2 i i+ state))
          (if (empty? es)
              (set `(inner ,cat ,e (,@ds ,d) ,e0s ,new-i ,kappa+))
              (set `(eval ,(car es) ,rhok ,new-i ,(cons `(frame ,cat ,e (,@ds ,d) ,(cdr es) ,e0s ,rhok ,new-fi) kappa+))))]
         [addr
          (for/set ([kont (hash-ref sigmak addr)])
            (match-define (list lid e+ i+)
              (match kont
                ['halt (list 'main (lbody id>lambda 'main) '())]
                [(cons `(frame ,_ ,e ,_ ,_ ,_ ,_ ,fi) _) (list (ast/loc-lambda-id e) e fi)]
                [addr
                 (define lid (car addr))
                 (list lid (lbody id>lambda lid) i)]))
            `(inner return ,e+ ,d (,rho) ,i+ ,kont))]))
     `(,new-states ,sigma ,sigmak)]
    [`(inner if ,_ (,d) (,t ,f ,rho) ,i ,kappa)
     (define new-states (for/set ([g d])
                          (match g
                            [#f `(eval ,f ,rho ,i ,kappa)]
                            [_ `(eval ,t ,rho ,i ,kappa)])))
     `(,new-states ,sigma ,sigmak)]
    [`(inner let ,_ (,d . ,ds) () ,i ,kappa)
     (match-define `(clo ,xs ,e ,rho) (set-first d))
     (define i+ (tick i (ast/loc-lambda-id e) state))
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
                (match clo
                  [`(clo ,xs ,e ,rho)
                   (define lid (ast/loc-lambda-id e))
                   (define i+ (tick i lid state))
                   (define ais (map (lambda (xi) (list xi i+)) xs))
                   (define rho+ (foldl (lambda (xi ai r)
                                         (hash-set r xi ai))
                                       rho
                                       xs ais))
                   (define sigma-new (foldl (lambda (ai di s)
                                              (store-include s ai di))
                                            sigma+
                                            ais ds))
                   (define ak `(,lid ,rho+))
                   (define sigmak-new (store-include sigmak+ ak (set kappa)))
                   `(,(set-add states `(eval ,e ,rho+ ,i+ ,ak)) ,sigma-new ,sigmak-new)]
                  [_ `(,(set-add states `(non-func ,clo)) ,sigma ,sigmak)]))
              `(,(set) ,sigma ,sigmak)
              (set->list d))]
    [else `(,(set) ,sigma ,sigmak)]))

(define (explore-state init id>lambda instr)
  (define (explore fronteer complete sigma sigmak)
    (define next (set-first fronteer))
    ;(pretty-print next)(display "\n")
    (define c-new (set-add complete next))
    (match-define `(,states-new ,sigma-new ,sigmak-new) (step-state next sigma sigmak instr id>lambda))
    (define f+ (set-union (set-rest fronteer) states-new))
    (define f-new (set-subtract f+ c-new))
    (if (and (equal? sigma sigma-new) (equal? sigmak sigmak-new))
        (if (set-empty? f-new)
            `(,c-new ,sigma-new ,sigmak-new)
            (explore f-new c-new sigma-new sigmak-new))
        (explore (set init) (set) sigma-new sigmak-new)))
  (explore (set init)(set)(hash)(hash)))

(define (regroup-by-call init states data-tables)
  (match-define (list sigma sigmak instr id>lambda) data-tables)
  (define state>state-trans (for/hash ([s states])
                              (match-define (list trans _ _) (step-state s sigma sigmak instr id>lambda))
                              (values s trans)))
  (define all-calls
    (foldl (lambda (s calls)
             (match s
               [`(inner apply . ,_)
                (foldl (lambda(t c)
                         (match t
                           [`(eval ,(ast/loc _ _ _ l) . ,_)
                            (store-include c l (set t))]
                           [else c]))
                       calls (set->list (hash-ref state>state-trans s)))]
               [else calls]))
           (hash (car (get-li init)) (set init))
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
  (define (make-subgraph lid)
    (define calls (mutable-set))
    (define returns (mutable-set))
    (define finals (mutable-set))
    (define (s->trans s) (hash-ref state>state-trans s (set)))
    (define init (hash-ref all-calls lid))
    (define (build-graph fronteer complete trans)
      (define next (set-first fronteer))
      (define complete+ (set-add complete next))
      (define next-trans
        (match next
          [(? set? (not (? set-empty?)))
           (define next-states (apply set-union (set-map next s->trans)))
           (match (set-first next)
             [(or
               `(eval ,(? atomic?) . ,_)
               `(inner return . ,_))
              (match-define (list stop go)
                (foldl (lambda(state bins)
                         (match-define (list stop go) bins)
                         (define k (get-kappa state))
                         (match k
                           [`((frame . ,_) . ,_) (list stop (set-union go (s->trans state)))]
                           [addr (list (set-union stop
                                                  (list->set
                                                   (set-map (s->trans state)
                                                            (lambda (state+)
                                                              (define li (get-li state+))
                                                              (match li
                                                                [(list lid _)
                                                                 (set-add! returns lid)
                                                                 (cons `(exit ,lid) `(return-out, lid))]
                                                                ['halt
                                                                 (set-add! finals state+)
                                                                 (cons state+ `(halt))]
                                                                [else
                                                                 (set-add! finals state+)
                                                                 (cons state+ `(stuck))])))))
                                       go)]))
                       (list (set) (set))
                       (set->list next)))
              (if (set-empty? go)
                  (make-immutable-hash (set->list stop))
                  (make-immutable-hash (cons (cons go `(step)) (set->list stop))))]
             [`(inner apply . ,_)
              (match-define (list stop go)
                (foldl (lambda(s rs)
                         (match-define (list stop go) rs)
                         (define li (get-li s))
                         (define k (get-kappa s))
                         (match li
                           [(list lid _)
                            (set-add! calls lid)
                            (define returns (hash-ref all-returns k (set)))
                            (if (set-empty? returns)
                                (list (set-add stop
                                               (cons `(no-return ,lid) `(call-out, lid))) go)
                                (list stop (cons
                                            (set-union returns (car go))
                                            (set-union (set lid) (cdr go)))))]
                           [else
                            (set-add! finals s)
                            (list (set-add stop (cons s `(stuck))) go)]))
                       (list (set) (cons (set)(set)))
                       (set->list next-states)))
              (if (set-empty? (car go))
                  (make-immutable-hash (set->list stop))
                  (make-immutable-hash (cons (cons (car go) `(call-return ,(cdr go)))
                                             (set->list stop))))]
             [(or
               `(inner if . ,_))
              (define (seg states)
                (define (seg states sets)
                  (cond [(set-empty? states) sets]
                        [else
                         (define expr (cadr (set-first states)))
                         (define new-set (foldl
                                          (lambda(state matches)
                                            (if (equal? expr (cadr state))
                                                (set-add matches state)
                                                matches))
                                          (set (set-first states))
                                          (set->list (set-rest states))))
                         (seg (set-subtract states new-set) (cons new-set sets))]))
                (seg states (list)))
              (make-immutable-hash (map (lambda(s)(cons s `(step))) (seg next-states)))]
             [else (hash next-states `(step))])]
          [else (hash)]))
      (define fronteer+ (set-subtract
                         (set-union (set-rest fronteer) (list->set (hash-keys next-trans)))
                         complete+))
      (define trans+ (hash-set trans next next-trans))
      (if (set-empty? fronteer+)
          trans+
          (build-graph fronteer+ complete+ trans+)))
    (define trans (build-graph (set init) (set) (hash))) 
    (list init trans calls returns finals))
  (cons (car (get-li init))
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

(define (instrument analysis-version)
  (match analysis-version
    ["0-cfa" (cfa 0)]
    ["1-cfa" (cfa 1)]
    ["2-cfa" (cfa 2)]))

(define (inject data)
  (match-define `(,ast ,ids) (build-ast data))
  (list `(eval ,ast ,(hash) () halt) ids))

(define (analyze json-ast start-token version)
  (define instr (instrument version))
  (match-define `(,ast ,id>lambda) (make-ast json-ast (string->symbol start-token)))
  (define init `(eval ,ast ,(hash) () halt))
  (match-define `(,states ,sigma ,sigmak) (explore-state init id>lambda instr))
  (list init states (list sigma sigmak instr id>lambda)))

(define (analyze-syn syn [instr (cfa 0)])
  (match-define `(,init ,id>lambda)(inject syn))
  (match-define `(,states ,sigma ,sigmak) (explore-state init id>lambda instr))
  (list init states (list sigma sigmak instr id>lambda)))

(define (explore instr data)
  (display "explored expression:\n")(show-syntax data)(display "\n")
  (match-define `(,initial-state ,id>lambda)(inject data))
  (define sg-results (explore-state initial-state id>lambda instr))
  (match-define (list states sigma sigmak) sg-results)
  (define tables (list sigma sigmak instr id>lambda))
  (match-define (list init trans subs) (regroup-by-call initial-state states tables))
  (cons states tables))

(define (ex1) (explore (cfa 0) `(let ([z ((lambda (y) y) (lambda (x) x))]) z)))
(define (ex2) (explore (cfa 0) `(let ([a ((lambda (x) (let ([a (x x)]) a))(lambda (x) (let ([a (x x)]) a)))]) a)))
(define (ex3) (explore (cfa 0) `((lambda (x) (x x))(lambda (x) (x x)))))
(define (ex5) (explore (cfa 0) `((((lambda (x) (lambda (y) (lambda (z) (((x x) y) z))))(lambda (a) (lambda (b) (lambda (c) (((b a) b) c)))))(lambda (a) (lambda (b) (lambda (c) (((c a) b) c)))))(lambda (a) (lambda (b) (lambda (c) (((a a) b) c)))))))
(define (ex6) (explore (cfa 0) `((lambda (x y z) (x x y z))(lambda (a b c) (b a b c))(lambda (a b c) (c a b c))(lambda (a b c) (a a b c)))))
;stuck states: free vars
(define (ex4) (explore (cfa 0) `(let ([a ((let ([b (x x)]) (let ([z b]) b)) (let ([c (z a)]) c))]) a)))

(define (ex7) (explore (cfa 0) `(let ([a #f][b #t][rev (lambda(r)(if r #f #t))])(rev (rev #t)))))
(define (ex8) (explore (cfa 0) `(let ([a #f][b (lambda(x)x)][call (lambda(c)(c #t))])(call (call b)))))