import { faker } from '@faker-js/faker'

import { User, type UserProps } from '@/modules/user/domain/user.entity'

export function makeUser(override: Partial<UserProps> = {}): User {
  return new User({
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    emailVerified: faker.datatype.boolean(),
    image: faker.image.avatar(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...override
  })
}
