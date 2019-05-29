#lang racket

(require
  racket/hash
  "consts.rkt"
  "global.rkt"
  "toks.rkt")

(provide parse)

(define (parse toks)
  (log LOG_TYPE_ENGINE "parsing")
  (define ast (make-hash))
  
  (define (error s)
    (log LOG_TYPE_ENGINE (string-append "ERROR: " s))
    (exit 1))

  (define hashsym_counter 0)
  (define (hashsym s)
    (set! hashsym_counter (+ 1 hashsym_counter))
    (string->symbol (format "~a~a" s hashsym_counter)))
  
  (define (peek n)
    (if (> (length toks) n)
      (list-ref toks n)
      '(tok "")))
  (define (peek-e n)
    (tok-s (peek n)))
  (define (expect e)
    (define tok (peek 0))
    (if (string=? (tok-s tok) e)
      (begin
        (set! toks (rest toks))
        tok)
      (error (format "expected token \"~a\"" e))))
  
  #;(define (prim? e)
    (member e '("define" "if" "quote" "begin")))
  (define (x? e)
    (regexp-match-exact? #px"[\\w]+" e))
  (define (b? e)
    (regexp-match-exact? #px"#t|#f" e))
  (define (n? e)
    (regexp-match-exact? #px"[\\d]+" e))
  (define (string->boolean s)
    (if (string=? s "#t")
      #t
      #f))
  
  (define (addBegin)
    (set! toks (append `(,(tokize "(" '(0 0) '()) ,(tokize "begin" '() '())) toks `(,(tokize ")" '() (tok-end (last toks)))))))
  (define (parseP)
    (define start (tok-start (expect (peek-e 0))))
    (define s (parseS))
    (define end (tok-end (expect (peek-e 0))))
    (define id (hashsym 's))
    (hash-set! ast id (hash-union (hash 's-expr s 'start start 'end end) (process s)))
    (tokize (~a id) start end))
  (define (parseS)
    (define e (peek-e 0))
    (define s
      (match e
        [(or "(" "[") (parseP)]
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
    (define form
      (cond
        [(x? a)
          (hash 'form "variable" 'data a)]
        [(b? a)
          (hash 'form "boolean" 'data (string->boolean a))]
        [(n? a)
          (hash 'form "number" 'data (string->number a))]
        [else
          (error (format "no atom match for \"~a\"" a))]
        ))
    (hash-set! ast id (hash-union (hash 'tok a 'start start 'end end) form))
    (tokize (~a id) start end))
  
  (define (process toks)
    (define aTok (tok-s (first toks)))
    (match aTok
      [(regexp #rx"a")
        (define form (tok-s (hash-ref ast (string->symbol aTok))))
        (case form
          [("lambda")
            (match-define `(,lambda-tok ,args-tok ,body-tok) toks)
            (define children
              (for/hash ([tok `(,args-tok ,body-tok)] [label '("args" "body")])
                (values (string->symbol (tok-s tok)) (hash 'label label))))
            (hash 'form form 'children children)]
          [("define")
            (match-define `(,define-tok ,id-tok ,body-toks ...) toks)
            (define body-tok-lst
              (if (list? body-toks)
                body-toks
                `(,body-toks)))
            (define children
              (for/hash ([tok body-tok-lst])
                (values (string->symbol (tok-s tok)) (hash))))
            (hash 'form form 'children children)]
          [("if")
            (match-define `(,if-tok ,ge-tok ,te-tok ,ee-tok) toks)
            (define children
              (for/hash ([tok `(,ge-tok ,te-tok ,ee-tok)] [label '("ge" "te" "ee")])
                (values (string->symbol (tok-s tok)) (hash 'label label))))
            (hash 'form form 'children children)]
          [("quote")
            (match-define `(,quote-tok ,data-tok) toks)
            (hash 'form form 'children (hash (string->symbol (tok-s data-tok)) (hash)))]
          [("begin")
            (match-define `(,begin-tok ,body-toks ...) toks)
            (define body-tok-lst
              (if (list? body-toks)
                body-toks
                `(,body-toks)))
            (define children
              (for/hash ([tok body-tok-lst])
                (values (string->symbol (tok-s tok)) (hash))))
            (hash 'form form 'children children)]
          [else (hash)])]
      [_
        (hash)]
    ))
  
  (addBegin)
  (define astStart (tok-s (parseP)))
  (values ast astStart))
