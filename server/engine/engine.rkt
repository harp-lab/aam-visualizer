#lang racket

(require
  json
  racket/cmdline
  racket/path
  "consts.rkt"
  "global.rkt"
  "lexer.rkt"
  "parser.rkt"
  "analyzer.rkt"
  "output.rkt"
  )

; handle commandline arguments
(define output-file-path (make-parameter ""))
(define input-file-path
  (command-line
    #:once-each
    [("-o" "--out")
      out
      "output file"
      (output-file-path out)]
    #:args (filename)
    filename))

; read input json
(define in (open-input-file input-file-path))
(define proj-hash (read-json in))
(close-input-port in)



; ENGINE
(log LOG_TYPE_ENGINE (format "processing \"~a\"" (file-name-from-path input-file-path)))
(define proj-id (hash-ref proj-hash 'id))
(define code-string (hash-ref proj-hash 'code))

; lexer
(define code-toks (lex code-string))

; parser
(define-values (code-ast code-astStart) (parse code-toks))

; analyzer
(match-define (list initial-state analysis-states data-tables) (analyze code-ast code-astStart))

; output
(define state-graph (full-state-graph analysis-states data-tables))

; write output json
(define out-hash
  (hash-set* proj-hash
    'status "done"
    'graphs (hash
      'ast (hash
        'graph code-ast
        'start code-astStart)
      'state (hash 'graph state-graph)
    )))
(define out
  (if (non-empty-string? (output-file-path))
    (open-output-file (output-file-path) #:exists 'replace)
    (open-output-file (string-append input-file-path "-out") #:exists 'replace)))
(log LOG_TYPE_ENGINE "writing")
(write-json out-hash out)
(close-output-port out)
