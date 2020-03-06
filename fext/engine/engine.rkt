#lang racket

(require
  json
  racket/cmdline
  racket/path
  racket/hash
  "consts.rkt"
  "global.rkt"
  "lexer.rkt"
  "parser.rkt"
  "analyzer.rkt"
  "plotter.rkt"
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
(define code-string (hash-ref proj-hash 'analysisInput))
(define analysis (hash-ref proj-hash 'analysis))


; lexer
(define code-toks (lex code-string))

; parser
(define-values (code-ast code-astStart) (parse code-toks))

; analyzer
(log LOG_TYPE_ENGINE "analyzing")
(match-define (list initial-state analysis-states data-tables) (analyze code-ast code-astStart analysis))
(define analysis-groupings (regroup-by-call initial-state analysis-states data-tables))

; output
(log LOG_TYPE_ENGINE "plotting")
(define items (all-items initial-state analysis-states analysis-groupings data-tables))



; write output json
(log LOG_TYPE_ENGINE (format "finished ~a analysis" analysis))
(define out-hash
  (hash-set* proj-hash
    'status "done"
    'analysisOutput (hash-union items (hash 'ast code-ast))))

(define out
  (if (non-empty-string? (output-file-path))
    (open-output-file (output-file-path) #:exists 'replace)
    (open-output-file (string-append input-file-path "-out") #:exists 'replace)))
(log LOG_TYPE_ENGINE "writing")
(write-json out-hash out)
(close-output-port out)
