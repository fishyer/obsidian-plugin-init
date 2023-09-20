const debug = console.log;
// 装饰器工具方法，用来统计函数的入参、出参和耗时
export function measure(
  target: any,
  key: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const functionName = key;

  descriptor.value = function (...args: any[]) {
    debug(`Function ${functionName} called with arguments:`, args);

    const startTime = performance.now();
    const result = originalMethod.apply(this, args);
    const endTime = performance.now();

    debug(`Function ${functionName} returned:`, result);
    debug(`Function ${functionName} took ${Math.round(endTime - startTime)}ms`);

    return result;
  };

  return descriptor;
}

// 装饰器工具方法，用来统计函数的入参、出参和耗时
export function measureAsync(
  target: any,
  key: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const functionName = key;

  descriptor.value = async function (...args: any[]) {
    debug(`Function ${functionName} called with arguments:`, args);

    const startTime = performance.now();
    const result = await originalMethod.apply(this, args);
    const endTime = performance.now();

    debug(`Function ${functionName} returned:`, result);
    debug(`Function ${functionName} took ${Math.round(endTime - startTime)}ms`);

    return result;
  };

  return descriptor;
}
