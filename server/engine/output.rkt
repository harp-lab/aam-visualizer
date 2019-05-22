#lang racket

(require json)
(require racket/hash)

(require "analyzer.rkt")

(provide full-state-graph function-graphs)

(define (graph-states states tables state-gen kont-gen)
  (match-define `(,id>lambda ,store ,kstore) tables)
  (define state-ids (for/hash ([s states][id (range (set-count states))]) (values s id)))
  (define state-tran (for/hash ([s states])
                       (match-define `(,st-tr ,_ ,_) (step-state s store kstore))
                       (values (hash-ref state-ids s) (for/hash ([tr st-tr])
                                                        (values (string->symbol(~a (hash-ref state-ids tr)))(hash))))))
  (define labels (cons 'halt (hash-keys kstore)))
  (define label-ids (for/hash ([l labels][id (range (length labels))]) (values l id)))
  (define k-closures
    (list->set
     (set-map (if (hash-empty? kstore)(set)(apply set-union (hash-values kstore)))
              (lambda(i) (match-define `(,c ,l) (divide-kont i)) `(,c ,(hash-ref label-ids l))))))
  (define k-c-ids (for/hash ([k k-closures][id (range (set-count k-closures))]) (values (car k) id)))
  (define l-c-trans (for/hash ([l labels])
                        (define l-tr (hash-ref kstore l (set)))
                        (values (hash-ref label-ids l) (for/hash ([tr l-tr])
                                                         (values (string->symbol(~a(hash-ref k-c-ids (car (divide-kont tr)))))(hash))))))
  `(,(state-gen states state-ids state-tran) ,(kont-gen k-closures k-c-ids l-c-trans)))

(define (graph-functions states groupings tables main-gen sub-gen)
  (match-define (list calls returns subs) groupings)
  (match-define `(,id>lambda ,store ,kstore) tables)
  (define state>ids (for/hash ([s states][id (range (set-count states))]) (values s id)))
  (define (s->sym s) (string->symbol (~a(hash-ref state>ids s))))
  (define all-funcs (set-union (list->set (hash-keys calls)) (list->set (hash-keys returns))))
  (define li>labels (for/hash ([num (range (set-count all-funcs))][f all-funcs])
                      (values f (format "~a-~a" num (car f)))))
  (define (li->sym li)
    (if (equal? li 'halt) 'halt (string->symbol (~a(hash-ref li>labels li)))))
  (define main-calls (for/hash([li (hash-keys calls)])
                       (define li-trans (hash-ref calls li))
                       (values (li->sym li)
                               (for/hash ([li li-trans])
                                 (values (li->sym li) (hash
                                                       ;'trans "call"
                                                       ))))))
  (define main-returns (for/hash([li (hash-keys returns)])
                         (define li-trans (hash-ref returns li))
                         (values (li->sym li)
                                 (for/hash ([li li-trans])
                                   (values (li->sym li) (hash
                                                         ;'trans "return"
                                                         ))))))
  (define main-trans (hash-union main-calls main-returns
                                 #:combine (lambda (c r)
                                             (hash-union c r #:combine
                                                         (lambda _ "call+return")))))
  (define (sub-states li)
    (match-define (list trans out-trans) (hash-ref subs li))
    (set-union (list->set (hash-keys trans)) (list->set (hash-keys out-trans))))
  (define (sub-trans li)
    (match-define (list trans out-trans) (hash-ref subs li))
    (define direct (for/hash([s (hash-keys trans)])
                     (define s-trans (hash-ref trans s))
                     (values (s->sym s) (for/hash ([s s-trans])
                                          (values (s->sym s) (hash
                                                              ;'trans "direct"
                                                              ))))))
    (define indirect (for/hash([s (hash-keys out-trans)])
                       (define s-trans (hash-ref out-trans s))
                       (values (s->sym s) (for/hash ([o s-trans])
                                            (match-define (list outs s) o)
                                            (values (s->sym s) (hash
                                                                ;'trans "return" 'outs (set->list outs)
                                                                ))))))
    
    (hash-union direct indirect))
  (define main-nodes (main-gen all-funcs li->sym main-trans))
  (define sub-nodes (for/hash ([li (hash-keys subs)])
                      (values (li->sym li) (hash
                                            'type "state"
                                            'graph (sub-gen (sub-states li) s->sym (sub-trans li))))))
  (list main-nodes sub-nodes))

(define (make-state-nodes states state-ids state-tran)
  (for/hash ([s states]) (values
                          (string->symbol (number->string
                                           (hash-ref state-ids s)))
                          (match (car s)
                            ['eval
                             (hash
                              'id (hash-ref state-ids s)
                              'form "eval"
                              'start (loc-start (cadr s))
                              'end (loc-end (cadr s))
                              'data (~a (only-syntax (cadr s)))
                              'children (hash-ref state-tran (hash-ref state-ids s)))]
                            ['inner
                             (hash
                              'id (hash-ref state-ids s)
                              'form (format "inner-~a" (cadr s))
                              'data (~a(only-syntax (caddr s)))
                              'start (loc-start (caddr s))
                              'end (loc-end (caddr s))
                              'children (hash-ref state-tran (hash-ref state-ids s)))]
                            [(? symbol? other)
                             (hash
                              'id (hash-ref state-ids s)
                              'form (symbol->string other)
                              'data ""
                              'children (hash-ref state-tran (hash-ref state-ids s)))]))))

(define (make-kont-nodes k-closures k-c-ids l-c-trans)
  (for/hash ([c k-closures]) (values
                              (string->symbol (number->string
                                           (hash-ref k-c-ids (car c))))
                              (hash
                               'id (hash-ref k-c-ids (car c))
                               'form "frames"
                               'data (~a (length (car c)))
                               'children (hash-ref l-c-trans (cadr c))))))

(define (make-func-nodes funcs li->sym trans)
  (for/hash ([li funcs])
    (define id (li->sym li))
    (values id (hash
                 'id (symbol->string id)
                 'form "function"
                 'data (~a (cadr li))
                 'children (hash-ref trans id)))))
(define (make-sub-nodes states s->sym trans)
  (for/hash ([s states])
    (define id (s->sym s))
    (values id (match (car s)
                 ['eval
                  (hash
                   'id (symbol->string id)
                   'form "eval"
                   'start (loc-start (cadr s))
                   'end (loc-end (cadr s))
                   'data (~a (only-syntax (cadr s)))
                   'children (hash-ref trans id))]
                 ['inner
                  (hash
                   'id (symbol->string id)
                   'form (format "inner-~a" (cadr s))
                   'data ""
                   'children (hash-ref trans id))]
                 [(? symbol? other)
                  (hash
                   'id (symbol->string id)
                   'form (symbol->string other)
                   'data ""
                   'children (hash-ref trans id))]))))

(define (full-state-graph analysis-states data-tables)
  (match-define `(,s-nodes ,k-nodes)
    (graph-states
     analysis-states
     data-tables
     make-state-nodes
     make-kont-nodes))
  s-nodes)

(define (function-graphs states groupings tables)
  (graph-functions
   states groupings tables
   make-func-nodes
   make-sub-nodes))
