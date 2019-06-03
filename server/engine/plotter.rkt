#lang racket

(require json)
(require racket/hash)

(require "analyzer.rkt")

(provide full-state-graph function-graphs)

(define (print-k k sigmak)
  (match k
    ['halt "halt"]
    [(cons `(frame ,cat . ,_) k) (format "~a::~a" cat (print-k k sigmak))]
    [addr
     (format "~a->~a" (car addr)
             (set-map (hash-ref sigmak addr)
                      (lambda(k)
                        (match k
                          ['halt "halt"]
                          [(cons `(frame ,cat . ,_) k) (format "~a::~a" cat (print-k k sigmak))]
                          [addr (format "~a->..." (car addr))]))))]))

(define (print-val v)
  (match v
    [`(clo ,xs ,e ,rho)
     (match-define (list l _) (get-li e))
     (~a l)]))

(define (make-env rho a->sym)
  (for/hash ([v (hash-keys rho)])
    (define addr (hash-ref rho v))
    (values (string->symbol (~a (only-syntax v)))
            (hash 'instr (~a (cadr addr)) 'store (symbol->string(a->sym addr))))))

(define (state-node id state a->sym sk)
  (match (car state)
    ['eval
     (hash
      'id id
      'form "eval"
      'start (loc-start (cadr state))
      'end (loc-end (cadr state))
      'env (make-env (caddr state) a->sym)
      'data (hash
             'label (format "~a - eval" id)
             'syntax (~a (only-syntax state))
             'instrumentation (~a (cadr (get-li state)))
             'kont (print-k (get-kappa state) sk))
      'states (list (list (~a (only-syntax state))
                          (~a (cadr (get-li state)))
                          (print-k (get-kappa state) sk))))]
    ['inner
     (hash
      'id id
      'form (~a (cadr state))
      'start (loc-start (caddr state))
      'end (loc-end (caddr state))
      'data (hash
             'label (format "~a - ~a" id (cadr state))
             'syntax (~a (only-syntax state))
             'instrumentation (~a (cadr (get-li state)))
             'kont (print-k (get-kappa state) sk))
     'states (list (list (~a (only-syntax state))
                         (~a (cadr (get-li state)))
                         (print-k (get-kappa state) sk))))]
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
  (match-define `(,id>lambda ,instr ,store ,kstore) tables)
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
  (match-define (list id>lambda insrt store kstore) tables)
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
        'start (loc-start syntax)
        'end (loc-end syntax)
        'data (hash
               'label (format "~a - ~a" id lid)
               'syntax (~a (only-syntax syntax)))
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
        'start (loc-start syntax)
        'end (loc-end syntax)
        'data (hash
               'label (format "~a - ~a" id (car n))
               'to-syntax (~a (only-syntax syntax)))
        'states (list (list (~a (only-syntax syntax))))
        'children (for/hash([child (hash-keys trans)])
                    (values (n->sym child)
                            (make-edge (hash-ref trans child)))))]
      [states
       (define s (if (set? states) (set-first states) states))
       (define synt (lambda(s)(~a (only-syntax s))))
       (define instr (lambda(s)(match (get-li s)[(list l i) (~a i)][end (~a end)])))
       (define kont (lambda(s)(match (get-kappa s) [(? symbol? k) (~a k)][k (print-k k kstore)])))
       (define in-one (lambda(s)(list (synt s) (instr s) (kont s))))
       (match s
         [`((or 'halt 'notfound) . ,_) (state-node (symbol->string id) s a->sym kstore)]
         [else
          (define base (state-node (symbol->string id) s a->sym kstore))
          (hash-set* base
                     'data (hash
                            'label (format "~a - ~a" id (hash-ref base 'form))
                            'syntax (if (set? states)(set-map states synt)(synt s))
                            'instrumentation (if (set? states)(set-map states instr)(instr s))
                            'kont (if (set? states)(set-map states kont)(kont s)))
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
