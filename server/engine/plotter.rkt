#lang racket

(require json)
(require racket/hash)

(require "analyzer.rkt")

(provide
 full-state-graph
 function-graphs
 all-items)

(define (print-k k sigmak)
  (match k
    ['halt (list "halt")]
    [(cons `(frame ,cat . ,_) k) (map (lambda(k2)(format "~a::~a" cat k2)) (print-k k sigmak))]
    [addr (flatten
           (set-map
            (hash-ref sigmak addr)
            (lambda(k)
              (map (lambda(k2)(format "~a->~a" (car addr) k2))
                   (match k
                     ['halt (list "halt")]
                     [(cons `(frame ,cat . ,_) k) (map (lambda(k2)(format "~a::~a" cat k2)) (print-k k sigmak))]
                     [addr (list (format "~a->..." (car addr)))])))))]))

(define (print-val v)
  (match v
    [#f (~a #f)]
    [#t (~a #t)]
    [`(clo ,xs ,e ,rho)
     (match-define (list l _) (get-li e))
     (~a l)]))

(define (make-env rho a->sym)
  (for/hash ([v (hash-keys rho)])
    (define addr (hash-ref rho v))
    (values (string->symbol (~a (only-syntax v)))
            (hash 'instr (~a (map only-syntax (cadr addr))) 'store (symbol->string(a->sym addr))))))

(define (state-node id state a->sym sk)
  (match (car state)
    ['eval
     (hash
      'id id
      'form "eval"
      'astLink (list (ast-id (cadr state)))
      'env (make-env (caddr state) a->sym)
      'data (hash
             'label (format "~a - eval" id))
      'states (list (hash 'syntax (~a (only-syntax state))
                          'instr (~a (map only-syntax (cadr (get-li state))))
                          'stack (print-k (get-kappa state) sk))))]
    ['inner
     (hash
      'id id
      'form (~a (cadr state))
      'astLink (list (ast-id (caddr state)))
      'data (hash
             'label (format "~a - ~a" id (cadr state)))
     'states (list (hash 'syntax (~a (only-syntax state))
                         'instr (~a (map only-syntax (cadr (get-li state))))
                         'stack (print-k (get-kappa state) sk))))]
    ['halt
     (hash
      'id id
      'form "halt"
      'env (make-env (caddr state) a->sym)
      'data (hash
             'label (format "~a - halt" id)
             'results (set-map (cadr state) print-val)))]
    [(? symbol? other)
     (hash
      'id id
      'form (symbol->string other)
      'data (hash
             'label (format "~a - ~a" id other)))]))

(define (full-state-graph states tables)
  (match-define (list store kstore instr id>lambda) tables)
  (define addr>id (for/hash([a (hash-keys store)][id (range (hash-count store))])(values a id)))
  (define (a->sym addr) (string->symbol (~a (hash-ref addr>id addr))))
  (define (state-gen states state-ids state-tran)
    (for/hash ([s states])
      (values
       (string->symbol (number->string
                        (hash-ref state-ids s)))
       (hash-set
        (state-node (hash-ref state-ids s) s a->sym kstore)
        'children (hash-ref state-tran (hash-ref state-ids s))))))
  (define state-ids (for/hash ([s states][id (range (set-count states))]) (values s id)))
  (define state-tran (for/hash ([s states])
                       (match-define `(,st-tr ,_ ,_) (step-state s store kstore instr id>lambda))
                       (values (hash-ref state-ids s) (for/hash ([tr st-tr])
                                                        (values (string->symbol(~a (hash-ref state-ids tr)))(hash))))))
  (state-gen states state-ids state-tran))

(define (function-graphs _ groupings tables)
  (match-define (list store kstore instr id>lambda) tables)
  (match-define (list init trans subs) groupings)
  (define all-nodes (list->set (apply append (hash-keys trans)
                           (map (lambda(sv)(hash-keys (cadr sv))) (hash-values subs)))))
  (define node>id (for/hash ([n all-nodes][id (range (set-count all-nodes))]) (values n id)))
  (define (n->sym node) (string->symbol (~a (hash-ref node>id node))))
  (define addr>id (for/hash([a (hash-keys store)][id (range (hash-count store))])(values a id)))
  (define (a->sym addr) (string->symbol (~a (hash-ref addr>id addr))))
  (define (make-edge data)
    (match data
      [`(call) (hash 'style (hash 'line-style "solid"))]
      [`(call-and-return) (hash 'style (hash 'line-style "solid"))]
      [`(return) (hash 'style (hash 'line-style "dashed"))]
      [`(stop) (hash 'style (hash 'line-style "solid"))]
      
      [`(return-out ,lid)
       (hash
        'style (hash'line-style "dashed")
        'calls (list (symbol->string (n->sym lid))))]
      [`(halt) (hash 'style (hash 'line-style "solid"))]
      [`(stuck) (hash 'style (hash 'line-style "solid"))]
      [`(call-out ,lid)
       (hash
        'style (hash 'line-style "dashed")
        'calls (list (symbol->string (n->sym lid))))]
      [`(call-return ,lids)
       (hash
        'style (hash 'line-style "dashed")
        'calls (set-map lids (lambda(n)(symbol->string (n->sym n)))))]
      [`(step) (hash 'style (hash 'line-style "solid"))]))
  (define (func-node n trans)
    (define id (n->sym n))
    (match n
      [`(halt ,d ,rho)
       (hash
        'id (symbol->string id)
        'form "halt"
        'env (make-env rho a->sym)
        'data (hash 'label (format "~a - halt" id)
                    'results (set-map d print-val))
        'children (hash))]
      [`(,form .,_)
       (hash
        'id (symbol->string id)
        'form (symbol->string form)
        'data (hash 'label (format "~a - ~a" id form))
        'children (hash))]
      [lid
       (define syntax (hash-ref id>lambda lid))
       (hash
        'id (symbol->string id)
        'form (~a lid)
        'detail (symbol->string id)
        'astLink (list (ast-id syntax))
        'data (hash
               'label (format "~a - ~a" id lid))
        'children (for/hash([child (hash-keys trans)])
                    (values (n->sym child)
                            (make-edge (hash-ref trans child)))))]))
  (define (detail-node n trans)
    (define id (n->sym n))
    (match n
      [`(halt . ,_) (state-node (symbol->string id) n a->sym kstore)]
      [`(,(or 'exit 'no-return) ,lid)
       (define syntax (hash-ref id>lambda lid))
       (hash
        'id (symbol->string id)
        'form (~a (car n))
        'astLink (list (ast-id syntax))
        'data (hash
               'label (format "~a - ~a" id (car n))
               'to-syntax (~a (only-syntax syntax)))
        'children (for/hash([child (hash-keys trans)])
                    (values (n->sym child)
                            (make-edge (hash-ref trans child)))))]
      [states
       (define s (if (set? states) (set-first states) states))
       (define synt (lambda(s)(~a (only-syntax s))))
       (define instr (lambda(s)(match (get-li s)[(list l i) (~a (map only-syntax i))][end (~a end)])))
       (define kont (lambda(s)(match (get-kappa s) [(? symbol? k) (list (~a k))][k (print-k k kstore)])))
       (define in-one (lambda(s)(hash 'syntax (synt s) 'instr (instr s) 'stack (kont s))))
       (match s
         [`((or 'halt 'notfound) . ,_) (state-node (symbol->string id) s a->sym kstore)]
         [else
          (define base (state-node (symbol->string id) s a->sym kstore))
          (hash-set* base
                     'data (hash
                            'label (format "~a - ~a" id (hash-ref base 'form)))
                     'states (if (set? states)(set-map states in-one)(list (in-one s)))
                     'children (for/hash([child (hash-keys trans)])
                                 (values (n->sym child)
                                         (make-edge (hash-ref trans child)))))])]))
  (define func-graph (hash
                      'type "state"
                      'start (symbol->string (n->sym init))
                      'graph (for/hash ([n (hash-keys trans)])
                               (values (n->sym n) (func-node n (hash-ref trans n))))))
  (define detail-graphs (for/hash ([s (hash-keys subs)])
                          (match-define (list s-init s-trans) (hash-ref subs s))
                          (values (n->sym s)
                                  (hash
                                   'type "state"
                                   'subGraphType "funcs"
                                   'start (symbol->string (n->sym s-init))
                                   'graph (for/hash ([n (hash-keys s-trans)])
                                            (values (n->sym n) (detail-node n (hash-ref s-trans n))))))))
  (define out-store (for/hash ([a (hash-keys store)])
                      (values (a->sym a) (set-map (hash-ref store a) print-val))))
  (list func-graph detail-graphs out-store))
  
(define (all-items states groupings tables)
  (match-define (list init trans subs) groupings)
  (match-define (list store kstore instr id>lambda) tables)

  (define (make-data->symbol id-hash)
    (lambda (val) (string->symbol (~a (hash-ref id-hash val)))))
  (define (make-id-hash set)
    (for/hash ([s set][id (range (set-count set))]) (values s id)))

  (define state>id (make-id-hash states))
  (define state->sym (make-data->symbol state>id))
  
  (define state-trans (for/hash ([s states])
                       (match-define `(,st-tr ,_ ,_) (step-state s store kstore instr id>lambda))
                       (values (hash-ref state>id s) (for/hash ([tr st-tr])
                                                       (values (state->sym tr)(hash))))))
  
  (define addr>id (make-id-hash (list->set (hash-keys store))))
  (define addr->sym (make-data->symbol addr>id))

  (define kaddr>id (make-id-hash (list->set (hash-keys kstore))))
  (define kaddr->sym (make-data->symbol kaddr>id))

  (match-define (list envs instrs konts)
    (foldl
     (lambda (state tables)
       (match-define (list envs instrs konts) tables)
       (match state
         [`(eval ,_ ,rho ,i ,kappa)
          (list (set-add envs rho)(set-add instrs i)(set-add konts kappa))]
         [`(inner ,_ ,_ ,_ ,_ ,i ,kappa)
          (list envs (set-add instrs i)(set-add konts kappa))]
         [_ tables]))
     (list (set)(set)(set))
     (set->list states)))

  (define env>id (make-id-hash envs))
  (define env->sym (make-data->symbol env>id))
  
  (define instr>id (make-id-hash instrs))
  (define instr->sym (make-data->symbol instr>id))

  (define kont>id (make-id-hash konts))
  (define kont->sym (make-data->symbol kont>id))
 
  (define (make-state s)
    (match s
      [`(eval ,ast ,rho ,i ,kappa)
       (hash
        'id (hash-ref state>id s)
        'form "eval"
        'expr (ast-id ast)
        'env (hash-ref env>id rho)
        'instr (hash-ref instr>id i)
        'kont (hash-ref kont>id kappa))]
      [`(inner ,cat ,ae ,d ,more ,i ,kappa)
       (hash
        'id (hash-ref state>id s)
        'form (symbol->string cat)
        'expr (ast-id ae)
        'instr (hash-ref instr>id i)
        'kont (hash-ref kont>id kappa))]
      [`(notfound ,ae ,rho ,i ,kappa)
       (hash
        'id (hash-ref state>id s)
        'form "not found"
        'expr (ast-id ae)
        'env (hash-ref env>id rho)
        'instr (hash-ref instr>id i)
        'kont (hash-ref kont>id kappa))]
      [`(halt ,dn, rho)
       (hash
        'id (hash-ref state>id s)
        'form "not found"
        'env (hash-ref env>id rho))]
      [`(non-func ,clo)
       (hash
        'id (hash-ref state>id s)
        'form "non-func")]
      [_
       (hash
        'id (hash-ref state>id s)
        'form "unknown")]))

  (define (make-addr addr) "todo")

  (define (make-kaddr kaddr) "todo")
  
  (hash
   'states (for/hash ([s states]) (values (state->sym s) (make-state s)))
   ;'state-graph state-trans
   'function-graphs "todo"
   'addr (for/hash ([a (hash-keys addr>id)]) (values (addr->sym a) (make-addr a)))
   'kaddr (for/hash ([a (hash-keys kaddr>id)]) (values (kaddr->sym a) (make-kaddr a)))
   'more? "todo"))

(define (test syntax)
  (match-define (list init states tables) (analyze-syn syntax))
  (define groups (regroup-by-call init states tables))
  (define state-graph (full-state-graph states tables))
  (match-define (list func-graph func-detail-graphs store)
    (function-graphs 'temp groups tables))
  (display "\n\nstates:\n")
  (pretty-print state-graph)
  (display "\n\nfunctions:\n")
  (pretty-print func-graph)
  (display "\n\nfunction-details:\n")
  (pretty-print func-detail-graphs)
)

(define (ex1) (test `((lambda(x)x)(lambda(y)y))))
(define (ex2) (test `((lambda (y) (y y)) (lambda (x) (x x)))))
