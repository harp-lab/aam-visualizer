#lang racket

(require
  json
  racket/hash
  racket/system
  "consts.rkt"
  "global.rkt")

; data directory paths
(define data-dir (build-path 'up "data"))
(define input-dir (build-path data-dir "input"))
(define output-dir (build-path data-dir "output"))
(define scan-interval 10)

(define (mark-error input-path output-path)
  (define in (open-input-file input-path))
  (define out (open-output-file output-path))
  (write-json (hash-set (read-json in) 'status "error") out)
  (close-input-port in)
  (close-output-port out))

; watcher loop
(define (watcher)
  (define files (directory-list input-dir))
  
  ; get next file to process
  (define/contract (next-file files)
    (-> (listof path-string?) path-string?)
    ; find oldest file in (front of queue)
    (argmin
      (lambda (file)
        (file-or-directory-modify-seconds (build-path input-dir file)))
      files))
  
  (cond
    [(null? files)
      (sleep scan-interval)]
    [else
      (define file (next-file files))
      (define input-path (build-path input-dir file))
      (define output-path (build-path output-dir file))
      
      ; call engine
      (log LOG_TYPE_WATCHER (format "~a - calling engine" file))
      (define success (system (format "racket engine.rkt -o ~a ~a" output-path input-path)))
      (cond
        [(not success)
          (log LOG_TYPE_WATCHER (format "~a - engine failed" file))
          (mark-error input-path output-path)])
      
      (log LOG_TYPE_WATCHER (format "~a - removing input" file))
      (delete-file input-path)
      ])
  (watcher))

(watcher)
