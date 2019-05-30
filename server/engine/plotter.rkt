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
     (format "~a->~a"
             (only-syntax (car addr))
             (set-map (hash-ref sigmak addr)(lambda(k)
                                              (match k
                                                ['halt "halt"]
                                                [(cons `(frame ,cat . ,_) k) (format "~a::~a" cat (print-k k sigmak))]
                                                [addr (format "~a->..."
                                                              (only-syntax (car addr)))]))))]))

(define (print-val v)
  (match v
    [`(clo ,xs ,e ,rho)
     (match-define (list l _) (get-li e))
     (~a l)]))

(define (state-node id state sk)
  (match (car state)
    ['eval
     (hash
      'id id
      'form "eval"
      'start (loc-start (cadr state))
      'end (loc-end (cadr state))
      'data (hash
             'syntax (~a (only-syntax state))
             'instrumentation (~a (cadr (get-li state)))
             'kont (print-k (get-kappa state) sk)))]
    ['inner
     (hash
      'id id
      'form (~a (cadr state))
      'start (loc-start (caddr state))
      'end (loc-end (caddr state))
      'data (hash
             'syntax (~a (only-syntax state))
             'instrumentation (~a (cadr (get-li state)))
             'kont (print-k (get-kappa state) sk)))]
    ['halt
     (hash
      'id id
      'form "halt"
      'data (hash
             'results (set-map (cadr state) print-val)))]
    [(? symbol? other)
     (hash
      'id id
      'form (symbol->string other))]))

(define (full-state-graph states tables)
  (match-define `(,id>lambda ,instr ,store ,kstore) tables)
  (define (state-gen states state-ids state-tran)
    (for/hash ([s states])
      (values
       (string->symbol (number->string
                        (hash-ref state-ids s)))
       (hash-set
        (state-node (hash-ref state-ids s) s kstore)
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
  (define (make-edge data)
    (match data
      [`(call) (hash 'style (hash 'line-style "solid"))]
      [`(call-and-return) (hash 'style (hash 'line-style "solid"))]
      [`(return) (hash 'style (hash 'line-style "dashed"))]
      [`(stop) (hash 'style (hash 'line-style "solid"))]
      
      [`(return-out ,li)
       (hash
        'style (hash'line-style "dashed")
        'calls (list (symbol->string (n->sym li))))]
      [`(halt) (hash 'style (hash 'line-style "solid"))]
      [`(stuck) (hash 'style (hash 'line-style "solid"))]
      [`(call-out ,li)
       (hash
        'style (hash 'line-style "dashed")
        'calls (list (symbol->string (n->sym li))))]
      [`(call-return ,lis)
       (hash
        'style (hash 'line-style "dashed")
        'calls (set-map lis (lambda(n)(symbol->string (n->sym n)))))]
      [`(step) (hash 'style (hash 'line-style "solid"))]))
  (define (func-node n trans)
    (define id (n->sym n))
    (match n
      [`(halt ,d)
       (hash
        'id (symbol->string id)
        'form "halt"
        'data (hash 'results (set-map d print-val))
        'children (hash))]
      [(list l i)
       (define syntax (hash-ref id>lambda l))
       (hash
        'id (symbol->string id)
        'form (~a l)
        'detail (symbol->string id)
        'start (loc-start syntax)
        'end (loc-end syntax)
        'data (hash
               'syntax (~a (only-syntax syntax))
               'instr (~a i))
        'children (for/hash([child (hash-keys trans)])
                    (values (n->sym child)
                            (make-edge (hash-ref trans child)))))]
      [`(,form .,_)
       (hash
        'id (symbol->string id)
        'form (symbol->string form)
        'children (hash))]))
  (define (detail-node n trans)
    (define id (n->sym n))
    (match n
      [`(,form ,(list l i))
       (define syntax (hash-ref id>lambda l))
       (hash
        'id (symbol->string id)
        'form (~a form)
        'start (loc-start syntax)
        'end (loc-end syntax)
        'data (hash
               'function-syntax (~a (only-syntax syntax))
               'function-instr (~a i))
        'children (for/hash([child (hash-keys trans)])
                    (values (n->sym child)
                            (make-edge (hash-ref trans child)))))]
      [states
       (define s (if (set? states) (set-first states) states))
       (define instr (lambda(s)(match (get-li s)[(list l i) (~a i)][end (~a end)])))
       (define kont (lambda(s)(match (get-kappa s) [(? symbol? k) (~a k)][k (print-k k kstore)])))
       (match s
         [`(halt . ,_) (state-node (symbol->string id) s kstore)]
         [else
          (hash-set* (state-node (symbol->string id) s kstore)
                     'data (hash
                            'syntax (if (set? states)(set-map states (lambda(s)(~a (only-syntax s))))(~a (only-syntax s)))
                            'instrumentation (if (set? states)(set-map states instr)(instr s))
                            'kont (if (set? states)(set-map states kont)(kont s)))
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
  (list func-graph detail-graphs))
  

(define (test syntax)
  (match-define (list init states tables) (analyze-syn syntax))
  (define groups (regroup-by-call init states tables))
  (define state-graph (full-state-graph states tables))
  (match-define (list func-graph func-detail-graphs)
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
