import { toast } from '@zerodevx/svelte-toast'

import UndoToast from '$lib/ui/UndoToast.svelte'

import type { Mutation } from '$lib/editing/mutations'
import type { Writable } from 'svelte/store'

export default {
  success: (message: string) => {
    toast.push(message, {
      theme: {
        '--toastBackground': '#48BB78',
        '--toastBarBackground': '#2F855A'
      }
    })
  },
  error: (message: string) => {
    toast.push(message, {
      theme: {
        '--toastBackground': '#F56565',
        '--toastBarBackground': '#C53030'
      }
    }
    )
  },
  undo: (mutation: Mutation, history: Writable<Mutation[]>, button: string, undo: () => void) => {
    toast.push({
      component: {
        src: UndoToast as any,
        props: {
          text: mutation.toString(),
          button,
          undo,
          mutation,
          history,
        },
      },
      theme: {
        '--toastWidth': '20rem'
      },
      duration: 8000
    })
  }
}