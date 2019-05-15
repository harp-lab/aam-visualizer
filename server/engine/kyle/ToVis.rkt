#lang racket

(require json)

(require "AI.rkt")

(define (make-state-nodes states state-ids state-tran)
  (for/hash ([s states]) (values
                          (string->symbol (number->string
                                           (hash-ref state-ids s)))
                          (hash
                           'id (hash-ref state-ids s)
                           'form (symbol->string (car s))
                           'start `(0 0)
                           'end `(0 0)
                           'data (~a (cadr s))
                           'nodes (hash-ref state-tran (hash-ref state-ids s))))))

(define (make-kont-nodes k-closures k-c-ids l-c-trans)
  (for/hash ([c k-closures]) (values
                              (string->symbol (number->string
                                           (hash-ref k-c-ids (car c))))
                              (hash
                               'id (hash-ref k-c-ids (car c))
                               'form "closure"
                               'start `(0 0)
                               'end `(0 0)
                               'data (~a (car c))
                               'nodes (hash-ref l-c-trans (cadr c))))))
  
(define example `((lambda (x) (x x))(lambda (x) (x x))))

(match-define `(,s-nodes ,k-nodes) (graph-syntax
   example
   make-state-nodes
   make-kont-nodes))

(write-json s-nodes)
(display "\n\n")
(write-json k-nodes)
