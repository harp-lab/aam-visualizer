#lang racket

(provide log)

(define/contract (log type s)
  (-> string? string? void?)
  (displayln (format "[~a] ~a" type s))
  (flush-output))
