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
(define scan-interval 1)

(define (mark-error input-path output-path)
  (define in (open-input-file input-path))
  (define out (open-output-file output-path))
  (write-json (hash-set (read-json in) 'status "error") out)
  (close-input-port in)
  (close-output-port out))
(define (mark-parse-error input-path output-path)
  (define in (open-input-file input-path))
  (define out (open-output-file output-path))
  (write-json (hash-set* (read-json in) 'status "error" 'error "parse") out)
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
  (define (promise-delete-file file-path)
    (if (file-exists? file-path)
      (promise-delete-file)
      'deleted))
  
  (cond
    [(null? files)
      (sleep scan-interval)]
    [else
      (define file (next-file files))
      (define input-path (build-path input-dir file))
      (define output-path (build-path output-dir file))
      
      ; call engine
      (log LOG_TYPE_WATCHER (format "~a - calling engine" file))
      (define exit_code (system/exit-code (format "racket engine.rkt -o ~a ~a" output-path input-path)))
      (match exit_code
        [2
          (log LOG_TYPE_WATCHER (format "~a - engine failed (parser)" file))
          (mark-parse-error input-path output-path)]
        [(not 0)
          (log LOG_TYPE_WATCHER (format "~a - engine failed" file))
          (mark-error input-path output-path)]
        [else #t])
      
      (log LOG_TYPE_WATCHER (format "~a - deleting input" file))
      (delete-file input-path)
      (promise-delete-file input-path)
      ])
  
  (watcher))

(watcher)
