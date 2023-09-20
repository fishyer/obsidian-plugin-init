// // 使用装饰器来修饰方法
// class MyClass {
//   @measure
//   myMethod(arg1: number, arg2: string): number {
//     // 执行一些逻辑
//     return arg1 + arg2.length;
//   }
// }

// // 创建实例并调用被修饰的方法
// const myObj = new MyClass();
// myObj.myMethod(10, "Hello");

// function createPromise(req: any, methodA: Function) {
//   return new Promise((resolve, reject) => {
//     try {
//       const resp = methodA(req);
//       resolve(resp);
//     } catch (error) {
//       reject(error);
//     }
//   });
// }