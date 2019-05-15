#lang racket

(require json)

(require "analyzer.rkt")

(provide s-nodes)

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
                              'nodes (hash-ref state-tran (hash-ref state-ids s)))]
                            ['proc
                             (hash
                              'id (hash-ref state-ids s)
                              'form (symbol->string (cadr s))
                              'start `(0 0)
                              'end `(0 0)
                              'data ""
                              'nodes (hash-ref state-tran (hash-ref state-ids s)))]
                            [other
                             (hash
                              'id (hash-ref state-ids s)
                              'form other
                              'start `(0 0)
                              'end `(0 0)
                              'data ""
                              'nodes (hash-ref state-tran (hash-ref state-ids s)))]))))

(define (make-kont-nodes k-closures k-c-ids l-c-trans)
  (for/hash ([c k-closures]) (values
                              (string->symbol (number->string
                                           (hash-ref k-c-ids (car c))))
                              (hash
                               'id (hash-ref k-c-ids (car c))
                               'form "frames"
                               'start `(0 0)
                               'end `(0 0)
                               'data (~a (length (car c)))
                               'nodes (hash-ref l-c-trans (cadr c))))))
  
;(define example `((lambda (x) (x x))(lambda (x) (x x))))
;(define json "parseoutput.json")

#;(match-define `(,s-nodes ,k-nodes)
  (graph-states
   example
   make-state-nodes
   make-kont-nodes))

;(write-json s-nodes)
;(display "\n\n")
;(write-json k-nodes)