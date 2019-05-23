#lang racket

(require json)
(require racket/hash)

(require "analyzer.rkt")

(provide full-state-graph function-graphs)

(define (state-node id state)
  (match (car state)
    ['eval
     (hash
      'id id
      'form "eval"
      'start (loc-start (cadr state))
      'end (loc-end (cadr state))
      'data (~a (only-syntax (cadr state))))]
    ['inner
     (hash
      'id id
      'form (format "inner-~a" (cadr state))
      'data (~a(only-syntax (caddr state)))
      'start (loc-start (caddr state))
      'end (loc-end (caddr state)))]
    [(? symbol? other)
     (hash
      'id id
      'form (symbol->string other)
      'data "")]))

(define (full-state-graph states tables)
  (match-define `(,id>lambda ,store ,kstore) tables)
  (define (state-gen states state-ids state-tran)
    (for/hash ([s states])
      (values
       (string->symbol (number->string
                        (hash-ref state-ids s)))
       (hash-set
        (state-node (hash-ref state-ids s) s)
        'children (hash-ref state-tran (hash-ref state-ids s))))))
  (define state-ids (for/hash ([s states][id (range (set-count states))]) (values s id)))
  (define state-tran (for/hash ([s states])
                       (match-define `(,st-tr ,_ ,_) (step-state s store kstore))
                       (values (hash-ref state-ids s) (for/hash ([tr st-tr])
                                                        (values (string->symbol(~a (hash-ref state-ids tr)))(hash))))))
  (state-gen states state-ids state-tran))

(define (function-graphs _ groupings tables)
  (match-define (list id>lambda store kstore) tables)
  (match-define (list init trans subs) groupings)
  (define all-nodes (list->set (apply append (hash-keys trans)
                           (map (lambda(sv)(hash-keys (cadr sv))) (hash-values subs)))))
  (define node>id (for/hash ([n all-nodes][id (range (set-count all-nodes))]) (values n id)))
  (define (n->sym node) (string->symbol (~a (hash-ref node>id node))))
  (define (make-edge data)
    (match data
      [`(call) (hash)]
      [`(call-and-return) (hash)]
      [`(return) (hash 'line-style "dotted")]
      [`(stop) (hash 'line-style "dotted")]
      
      [`(return-out) (hash 'line-style "dotted")]
      [`(halt) (hash 'line-style "dotted")]
      [`(stuck) (hash 'line-style "dotted")]
      [`(call-out) (hash 'line-style "dotted")]
      [`(call-return ,lis)
       (hash
        'line-style "dotted"
        'calls (set-map lis (lambda(n)(symbol->string (n->sym n))))
        'call (symbol->string (n->sym (set-first lis))))]
      [`(step) (hash)]))
  (define (func-node n trans)
    (define id (n->sym n))
    (match n
      [(? symbol?)
       (hash
        'id (symbol->string id)
        'form (symbol->string n)
        'children (hash))]
      [(list l i)
       (define syntax (hash-ref id>lambda l))
       (hash
        'id (symbol->string id)
        'form (~a l)
        'detail (symbol->string id)
        'data (~a (only-syntax syntax))
        'start (loc-start syntax)
        'end (loc-end syntax)
        'instr (~a i)
        'children (for/hash([child (hash-keys trans)])
                    (values (n->sym child)
                            (make-edge (hash-ref trans child)))))]))
  (define (detail-node n trans)
    (define id (n->sym n))
    (match n
      [`(,form ,(list l i))
       (define syntax (hash-ref id>lambda l))
       (hash
        'id (symbol->string id)
        'form form
        'data (~a (only-syntax syntax))
        'start (loc-start syntax)
        'end (loc-end syntax)
        'instr (~a i)
        'children (for/hash([child (hash-keys trans)])
                    (values (n->sym child)
                            (make-edge (hash-ref trans child)))))]
      [states
       (define s (if (set? states) (set-first states) states))
       (hash-set* (state-node (symbol->string id) s)
                  'instr (~a (cadr (get-li s)))
                  'children (for/hash([child (hash-keys trans)])
                              (values (n->sym child)
                                      (make-edge (hash-ref trans child)))))]))
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

(define (ex1) (test `(let ([z ((lambda (y) y) (lambda (x) x))]) z)))
(define (ex2) (test `((lambda (y) (y y)) (lambda (x) (x x)))))