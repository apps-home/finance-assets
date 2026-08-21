// Representa um valor que pode ser Left (erro) ou Right (sucesso)
export class Left<L, R> {
  readonly value: L // Armazena o valor de erro

  constructor(value: L) {
    this.value = value
  }

  // Verifica se é um Left (erro)
  isLeft(): this is Left<L, R> {
    return true
  }

  // Verifica se é um Right (sucesso)
  isRight(): this is Right<L, R> {
    return false
  }
}

// Representa o caso de sucesso
export class Right<L, R> {
  readonly value: R // Armazena o valor de sucesso

  constructor(value: R) {
    this.value = value
  }

  isLeft(): this is Left<L, R> {
    return false
  }

  isRight(): this is Right<L, R> {
    return true
  }
}

// Union type que pode ser Left ou Right
export type Either<L, R> = Left<L, R> | Right<L, R>

// Factory function para criar um Left (erro)
export const left = <L, R>(l: L): Either<L, R> => {
  return new Left<L, R>(l)
}

// Factory function para criar um Right (sucesso)
export const right = <L, R>(r: R): Either<L, R> => {
  return new Right<L, R>(r)
}
