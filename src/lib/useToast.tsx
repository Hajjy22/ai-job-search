import { useCallback, useState } from 'react'
import { Toast } from '../components/ui'

let toastId = 0

export function useToast() {
  const [toast, setToast] = useState<{ message: string; error?: boolean; id: number } | null>(null)

  const showToast = useCallback((message: string, error?: boolean) => {
    const id = ++toastId
    setToast({ message, error, id })
    setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current))
    }, 3000)
  }, [])

  const toastNode = toast ? <Toast message={toast.message} error={toast.error} /> : null

  return { showToast, toastNode }
}
