#lang racket

(require json)

(require "analyzer.rkt")

(provide full-state-graph)

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
                            ['proc
                             (hash
                              'id (hash-ref state-ids s)
                              'form (format "proc-~a" (cadr s))
                              'data ""
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
  
(define (full-state-graph analysis-states data-tables)
  (match-define `(,s-nodes ,k-nodes)
    (graph-states
     analysis-states
     data-tables
     make-state-nodes
     make-kont-nodes))
  s-nodes)
