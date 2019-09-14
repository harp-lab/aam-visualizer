#lang racket

(require
  racket/hash
  racket/pretty
  "consts.rkt"
  "global.rkt"
  "toks.rkt")

(provide parse)

(define (parse toks)
  (log LOG_TYPE_ENGINE "parsing")
  (define ast (make-hash))
  
  (define (error s)
    (log LOG_TYPE_ENGINE (string-append "ERROR: " s))
    (exit 2))

  (define hashsym_counter 0)
  (define (hashsym s)
    (set! hashsym_counter (+ 1 hashsym_counter))
    (string->symbol (format "~a~a" s hashsym_counter)))
  
  (define (peek n)
    (if (> (length toks) n)
      (list-ref toks n)
      (hash 'tok "")))
  (define (peek-e n)
    (tok-s (peek n)))
  (define (expect e)
    (define tok (peek 0))
    (if (string=? (tok-s tok) e)
      (begin
        (set! toks (rest toks))
        tok)
      (error (format "expected token \"~a\"" e))))
  
  (define (addBegin)
    (set! toks (append `(,(tokize "(" '(0 0) '(0 0)) ,(tokize "begin" '(0 0) '(0 0))) toks `(,(tokize ")" '(0 0) (tok-end (last toks)))))))
  (define (parseP)
    (define start (tok-start (expect (peek-e 0))))
    (define s (parseS))
    (define end (tok-end (expect (peek-e 0))))
    (define id (hashsym 's))
    (hash-set! ast id (hash 's-expr s 'start start 'end end))
    (~a id))
  (define (parseS)
    (define e (peek-e 0))
    (define s
      (match e
        [(or "(" "[") (parseP)]
        ["" (error "invalid syntax")]
        [_ (parseA)]))
    (match (peek-e 0)
      [(or ")" "]") `(,s)]
      [_ `(,s . ,(parseS))]))
  (define (parseA)
    (define tok (expect (peek-e 0)))
    (define a (tok-s tok))
    (define start (tok-start tok))
    (define end (tok-end tok))
    (define id (hashsym 'a))
    (hash-set! ast id (hash 'tok a 'start start 'end end))
    (~a id))
  
  (addBegin)
  (define astStart (parseP))
  (values ast astStart))
