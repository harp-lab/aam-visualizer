#lang racket

(provide
  tokize
  tok-s
  tok-start
  tok-end)

(define (tokize s start end)
  (hash 'tok s 'start start 'end end))
(define (tok-s tok)
  (hash-ref tok 'tok))
(define (tok-start tok)
  (hash-ref tok 'start))
(define (tok-end tok)
  (hash-ref tok 'end))
