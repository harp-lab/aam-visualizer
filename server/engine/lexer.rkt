#lang racket

(require
  "consts.rkt"
  "global.rkt"
  "toks.rkt")

(provide lex)

(define (lex s)
  (log LOG_TYPE_ENGINE "lexing")
  (define (empty? e) (not (non-empty-string? e)))
  (define (newline? e) (regexp-match-exact? #px"\r\n|\n" e))
  (define (space? e) (regexp-match-exact? #px"[\\s]+" e))
  
  (define (lex-e s row col)
    (define e (first (regexp-match
      #px"\\(|\\)|\\[|\\]|#t|#f|[\\w]+|\r\n|\n|[\\s]+"
      s)))
    (define len (string-length e))
    (define es (substring s len))
    (define col+ (+ col len))
    (define tok (tokize e `(,row ,col) `(,row ,col+)))
    
    (if (empty? es)
      (if (space? e)
        '()
        `(,tok))
      (if (newline? e)
        (lex-e es (+ row 1) 0)
        (if (space? e)
          (lex-e es row col+)
          `(,tok . ,(lex-e es row col+))))))
  
  (lex-e s 0 0))
