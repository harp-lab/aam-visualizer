#lang racket

(require json)
(require racket/hash)

(require "analyzer.rkt")

(provide all-items)

;; String representation of a continuation.
;; uses ... to avoid non-termination, but it's probably not enough for all cases. Need to rewrite.
(define (print-k k sigmak)
  (match k
    ['halt (list "halt")]
    [(cons `(frame ,cat . ,_) k) (map (lambda(k2)(format "~a::~a" cat k2)) (print-k k sigmak))]
    [addr (flatten
           (set-map
            (hash-ref sigmak addr)
            (lambda(k)
              (map (lambda(k2)(format "~a->~a" (car addr) k2))
                   (match k
                     ['halt (list "halt")]
                     [(cons `(frame ,cat . ,_) k) (map (lambda(k2)(format "~a::~a" cat k2)) (print-k k sigmak))]
                     [addr (list (format "~a->..." (car addr)))])))))]))

;;main function for creating a hash-table of analysis data
(define (all-items initial-state states groupings tables)
  (match-define (list initial-func trans subs) groupings)
  (match-define (list store kstore instr id>lambda) tables)

  ;; Two helpers to make data lookups, one creates a hash-table, the other a function
  ;; enumerate the values of a set, returning a hash-table to look up those values
  (define (make-id-hash set tag)
    (for/hash ([s set][id (range (set-count set))]) (values s (~a tag "-" id))))
  ;; lookup and convert ids to symbols in one step. Symbols are required for hash-keys in output.
  (define (make-data->symbol id-hash)
    (lambda (val) (string->symbol (~a (hash-ref id-hash val)))))

  ;; state id lookups
  (define state>id (make-id-hash states "state"))
  (define state->sym (make-data->symbol state>id))

  ;; address id lookups
  (define addr>id (make-id-hash (list->set (hash-keys store)) "addr"))
  (define addr->sym (make-data->symbol addr>id))

  ;; continuation address id loopups
  (define kaddr>id (make-id-hash (list->set (hash-keys kstore)) "kaddr"))
  (define kaddr->sym (make-data->symbol kaddr>id))

  ;; search through all states, collecting sets of each item:
  ;;   values, environments, instrumentation, continuations
  (match-define (list vals envs instrs konts)
    (foldl
     (lambda (state tables)
       (match-define (list vals envs instrs konts) tables)
       (match state
         [`(eval ,(? atomic? ae) ,rho ,i ,kappa)
          (define new-vals (atomic ae rho store))
          (list (set-union new-vals vals)(set-add envs rho)(set-add instrs i)(set-add konts kappa))]
         [`(eval ,_ ,rho ,i ,kappa)
          (list vals (set-add envs rho)(set-add instrs i)(set-add konts kappa))]
         [`(inner ,_ ,_ ,ds ,_ ,i ,kappa)
          (list (apply set-union vals (if (list? ds)ds(list ds))) envs (set-add instrs i)(set-add konts kappa))]
         [_ tables]))
     (list (set)(set)(set)(set))
     (set->list states)))

  ;; environment id lookups
  (define env>id (make-id-hash envs "env"))
  (define env->sym (make-data->symbol env>id))

  ;; instrumentation id lookups
  (define instr>id (make-id-hash instrs "instr"))
  (define instr->sym (make-data->symbol instr>id))

  ;; continuation id lookups
  (define kont>id (make-id-hash konts "stack"))
  (define kont->sym (make-data->symbol kont>id))

  ;; function id lookups
  (define func>id (make-id-hash (hash-keys trans) "func"))
  (define func->sym (make-data->symbol func>id))

  ;; create an output edge from an input edge
  ;; saves style info and which functions to highlight when clicked (calls)
  (define (make-edge edge)
    (match edge
      ;; interfunction edges
      [`(call) (hash 'style (hash 'line-style "solid"))]
      [`(call-and-return) (hash 'style (hash 'line-style "solid"))]
      [`(return) (hash 'style (hash 'line-style "dashed"))]
      [`(stop) (hash 'style (hash 'line-style "solid"))]

      ;; intrafunction edges
      [`(return-out ,func)
       (hash
        'style (hash'line-style "dashed")
        'calls (list (hash-ref func>id func)))]
      [`(halt) (hash 'style (hash 'line-style "solid"))]
      [`(stuck) (hash 'style (hash 'line-style "solid"))]
      [`(call-out ,func)
       (hash
        'style (hash 'line-style "dashed")
        'calls (list (hash-ref func>id func)))]
      [`(call-return ,funcs)
       (hash
        'style (hash 'line-style "dashed")
        'calls (set-map funcs (lambda(f)(hash-ref func>id f))))]
      [`(step) (hash 'style (hash 'line-style "solid"))]))

  ;; convert interfunction graph to output format, no change in structure 
  (define func-trans (for/hash ([f (hash-keys trans)])
                       (define f-trans (hash-ref trans f))
                       (values (func->sym f)
                               (for/hash([target (hash-keys f-trans)])
                                 (values (func->sym target)
                                         (make-edge (hash-ref f-trans target)))))))

  ;; search all function graphs for "configurations", saving them in a set mapped to their containing function.
  ;; configurations may be:
  ;;   special states (halt, no-return,...)
  ;;   single states (defined in the initial set to the first fold below)
  ;;   sets of states (untagged)
  (define confs>func
    (foldl ;over functions 
     (lambda (func confs)
       (match-define (list _ f-trans) (hash-ref subs func))
       (foldl ;over graph nodes
        (lambda(c confs)
          (foldl ;over transition edges
           (lambda(t confs)
             (hash-set confs t func))
           (hash-set confs c func)
           (hash-keys (hash-ref f-trans c))))
        confs
        (hash-keys f-trans)))
     (for/hash ([s states])(values `(state ,s) (get-li s)))
     (hash-keys subs)))

  ;; configuration id lookups
  (define conf>id (make-id-hash (hash-keys confs>func) "config"))
  (define conf->sym (make-data->symbol conf>id))

  ;; create output graph of primary analysis states by calling step function
  (define state-trans (for/hash ([s states])
                       (match-define `(,st-tr ,_ ,_) (step-state s store kstore instr id>lambda))
                       (values (conf->sym `(state ,s)) (for/hash ([tr st-tr])
                                                       (values (conf->sym `(state ,tr))(hash))))))

  ;; convert set of function graphs to output format, no change in structure (apart from new labels)
  (define func-conf-graphs (for/hash ([f (hash-keys subs)])
                             (match-define (list f-init f-trans) (hash-ref subs f))
                             (values (func->sym f)
                                     (hash
                                      'start (hash-ref conf>id f-init)
                                      'graph (for/hash ([c (hash-keys f-trans)])
                                               (define c-trans (hash-ref f-trans c))
                                               (values (conf->sym c) (for/hash ([t (hash-keys c-trans)])
                                                                       (values (conf->sym t)
                                                                               (make-edge (hash-ref c-trans t))))))))))

  ;; value id lookup
  (define val>id (make-id-hash vals "val"))
  (define val->sym (make-data->symbol val>id))
  
  ;; convert state to output format, looking up ids for components
  (define (make-state s)
    (match s
      [`(eval ,ast ,rho ,i ,kappa)
       (hash
        'form "eval"
        'expr (ast-id ast)
        'exprString (~a (only-syntax ast))
        'env (hash-ref env>id rho)
        'instr (hash-ref instr>id i)
        'frame (hash-ref kont>id kappa))]
      [`(inner ,cat ,ae ,d ,more ,i ,kappa)
       (hash
        'form (symbol->string cat)
        'expr (ast-id ae)
        'exprString (~a (only-syntax ae))
        'vals (map
               (lambda(vs)(set-map vs (lambda(v)(hash-ref val>id v))))
               (if (list? d)d(list d)))
        'instr (hash-ref instr>id i)
        'frame (hash-ref kont>id kappa))]
      [`(notfound ,ae ,rho ,i ,kappa)
       (hash
        'form "not found"
        'expr (ast-id ae)
        'exprString (~a (only-syntax ae))
        'env (hash-ref env>id rho)
        'instr (hash-ref instr>id i)
        'frame (hash-ref kont>id kappa))]
      [`(halt ,d, rho)
       (hash
        'results (set-map d (lambda(v)(hash-ref val>id v)))
        'form "halt"
        'env (hash-ref env>id rho))]
      [`(non-func ,clo)
       (hash
        'form "non-func")]
      [_
       (hash
        'form "unknown")]))

  ;; unused, data is available in environments
  (define (make-addr addr)
    (match-define (list var instr) addr)
    ;addr is (list variable instr)
    "todo")

  ;; unused, data is available in continuation, addr form
  (define (make-kaddr kaddr)
    ;kaddr is (list lid env)
    "todo")

  ;; convert instrumentation to output format
  (define (make-instr i)
    (hash
     'exprs (map (lambda(e)(ast-id e)) i)
     'exprStrings (map (lambda(e)(~a (only-syntax e))) i)))

  ;; convert function (and special graph nodes) to output format
  (define (make-func func)
    (match func
      [`(halt ,d ,rho)
       (hash
        'form "halt"
        'results (set-map d (lambda(v)(hash-ref val>id v)))
        'env (hash-ref env>id rho))]
      [`(,form .,_)
       (hash
        'form (symbol->string form))]
      [lid
       (hash
        'form (~a lid)
        'expr (ast-id (hash-ref id>lambda lid))
        'exprString (~a (only-syntax (hash-ref id>lambda lid)))
        ;'detail?
        ;'astLink?
        'more? "todo")]))

  ;convert config to output format
  (define (make-config conf)
    (define id (hash-ref conf>id conf))
    (match conf
      [(or
        `(halt ,d, rho)
        `(state (halt ,d ,rho)))
       (hash
        'id id
        'results (set-map d (lambda(v)(hash-ref val>id v)))
        'env (hash-ref env>id rho)
        'astLink (list)
        'form "halt"
        'states (list (hash-ref state>id `(halt ,d ,rho))))]
      [`(,(or 'exit 'no-return) ,lid)
       (define out-expr (hash-ref id>lambda lid))
       (hash
        'id id
        'form (~a (car conf))
        'astLink (list (ast-id out-expr)))]
      [`(state ,s)
       (define state (make-state s))
       (hash
        'id id
        'form (hash-ref state 'form)
        'astLink (flatten (list (hash-ref state 'expr (list))))
        'states (list (hash-ref state>id s)))]
      [states
       (define first-state (make-state (if (set? states) (set-first states) states)))
       (define state-ids (if (set? states)
                             (set-map states (lambda(s)(hash-ref state>id s)))
                             (list (hash-ref state>id states))))
       (define states-info (if (set? states)
                               (set-map states make-state)
                               (list (make-state states))))
       (hash
        'id id
        'form (hash-ref first-state 'form)
        'astLink (flatten (map (lambda(s)(hash-ref s 'expr (list))) states-info))
        'states state-ids)]))

  ;; convert environment to output format, a list with an entry for each variable
  (define (make-env env)
    (for/list ([var (hash-keys env)])
      (define addr (hash-ref env var))
      (hash
       'var (ast-id var)
       'varString (~a (only-syntax var))
       'instr (hash-ref instr>id (cadr addr))
       'addr (hash-ref addr>id addr))))

  ;; convert values to output format
  (define (make-val v)
    (match v
      [(? boolean?)
       (hash
        'type "bool"
        'val v
        'valString (~a v))]
      [`(clo ,xs ,e ,rho)
       (hash
        'type "closure"
        'ast (func-id e id>lambda)
        'astString (format "λ~a~a" (map (lambda(x)(~a (only-syntax x))) xs) (~a (only-syntax e)))
        'name (~a (car (get-li e)))
        'env (hash-ref env>id rho))]))

  ;convert continuation to output format
  (define (make-kont k)
    (define descs (print-k k kstore))
    (match k
      ['halt
       (hash
        'form "halt"
        'descs descs)]
      [(cons `(frame ,cat ,e ,vals ,_exps ,_other ,env ,instr) k)
       (hash
        'form "frame"
        'descs descs
        'type (~a cat)
        'expr (ast-id e)
        'exprString (~a (only-syntax e))
        'vals (map (lambda(vs) (set-map vs (lambda(v)(hash-ref val>id v)))) vals) 
        'env (hash-ref env>id env)
        'instr (hash-ref instr>id instr)
        'next (hash-ref kont>id k))]
      [addr
       (hash
        'form "addr"
        'descs descs
        'func (hash-ref func>id (car addr))
        'env (hash-ref env>id (cadr addr))
        'frames (set-map
                (hash-ref kstore addr)
                (lambda(k)(hash-ref kont>id k))))]))            

  ;store-entries are hash addr-id > (list val-id...)

  ;; create final table of items, calling creation functions for each element
  (hash
    'states (for/hash ([s states]) (values (state->sym s) (make-state s)))
    'funcs (for/hash ([f (hash-keys func>id)]) (values (func->sym f) (make-func f)))
    'graphs (hash-union (hash 
      'states (hash 'start (hash-ref conf>id `(state ,initial-state)) 'graph state-trans)
      'funcs (hash 'start (hash-ref func>id initial-func) 'graph func-trans))
      func-conf-graphs)
    'configs (for/hash ([c (hash-keys conf>id)]) (values (conf->sym c) (make-config c)))
    'envs (for/hash ([e (hash-keys env>id)]) (values (env->sym e) (make-env e)))
    'instr (for/hash ([i (hash-keys instr>id)]) (values (instr->sym i) (make-instr i)))
    'frames (for/hash ([k (hash-keys kont>id)]) (values (kont->sym k) (make-kont k)))
    'vals (for/hash ([v (hash-keys val>id)]) (values (val->sym v) (make-val v)))
    'store (for/hash ([a (hash-keys addr>id)])
                      (values (addr->sym a) (set-map (hash-ref store a) (lambda(v)(hash-ref val>id v)))))
    ;'addr (for/hash ([a (hash-keys addr>id)]) (values (addr->sym a) (make-addr a)))
    ;'kaddr (for/hash ([a (hash-keys kaddr>id)]) (values (kaddr->sym a) (make-kaddr a)))
    'more? "todo"))
