import * as React from "react"

/**
 * Retorna uma versão "debounced" de `callback`: só dispara após `delay` ms sem
 * novas chamadas, coalescendo várias mudanças seguidas num único efeito.
 * Faz flush do valor pendente ao desmontar (não perde o último valor digitado).
 */
export function useDebouncedCallback<A extends unknown[]>(
  callback: (...args: A) => void,
  delay: number
): (...args: A) => void {
  const callbackRef = React.useRef(callback)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pending = React.useRef<A | null>(null)

  // Mantém a referência da função sempre atualizada (sem recriar o debounced).
  React.useEffect(() => {
    callbackRef.current = callback
  })

  const flush = React.useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (pending.current) {
      callbackRef.current(...pending.current)
      pending.current = null
    }
  }, [])

  // Garante a persistência do valor pendente ao desmontar.
  React.useEffect(() => flush, [flush])

  return React.useCallback(
    (...args: A) => {
      pending.current = args
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        timer.current = null
        if (pending.current) {
          callbackRef.current(...pending.current)
          pending.current = null
        }
      }, delay)
    },
    [delay]
  )
}
