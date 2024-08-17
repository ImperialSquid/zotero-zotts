export function waitUntil(
  condition: () => boolean,
  callback: () => void,
  interval = 100,
  timeout = 10000,
) {
  const start = Date.now();
  const intervalId = setInterval(() => {
    if (condition()) {
      clearInterval(intervalId);
      callback();
    } else if (Date.now() - start > timeout) {
      clearInterval(intervalId);
    }
  }, interval);
}

export function waitUtilAsync(
  condition: () => boolean,
  interval = 100,
  timeout = 10000,
) {
  return new Promise<void>((resolve, reject) => {
    const start = Date.now();
    const intervalId = setInterval(() => {
      if (condition()) {
        clearInterval(intervalId);
        resolve();
      } else if (Date.now() - start > timeout) {
        clearInterval(intervalId);
        reject();
      }
    }, interval);
  });
}

// adapted from https://stackoverflow.com/questions/38213668/promise-retry-design-patterns
export function retryUntilAsync(
    func: () => Promise<any>,
    tries: number,
    delay: 100
) {
  return new Promise<Error | void>((resolve, reject) => {
    let error: Error
    let attempt = function() {
      if (tries == 0) {
        reject(error)
      } else {
        func()
            .then(
                () => {
                  resolve()
                }
            ).catch(
                (e) => {
                  tries--
                  error = e
                  setTimeout(() => {
                    attempt()
                  }, delay)
            })
      }
    }
    attempt()
  })
}