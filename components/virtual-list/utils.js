export function throttle(func, wait, options = {}) {
  let timeout = null
  let previous = 0

  return function (...args) {
    const now = Date.now()
    const { leading = true } = options

    if (!previous && leading === false) {
      previous = now
    }

    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = leading === false ? 0 : Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}
