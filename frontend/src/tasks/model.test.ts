import { expect, it } from 'vitest'
import { validate } from './model'

it('counts Unicode code points consistently with Go', () => {
  expect(
    validate({
      title: '🧭'.repeat(120),
      description: 'á'.repeat(2000),
      status: 'todo',
    }),
  ).toEqual({})
  expect(
    validate({
      title: '🧭'.repeat(121),
      description: 'a'.repeat(2001),
      status: 'done',
    }),
  ).toHaveProperty('title')
  expect(
    validate({ title: '   ', description: '', status: 'todo' }),
  ).toHaveProperty('title')
})
