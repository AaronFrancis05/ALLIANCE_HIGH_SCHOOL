/**
 * The parts of the home page the school controls: hero slides, the Head Teacher's
 * welcome and the "why choose us" cards.
 */

import type { GlobalConfig } from 'payload'
import { anyone, roles } from '../access/roles'
import { revalidateGlobalAfterChange } from '../lib/revalidate'

export const HomePage: GlobalConfig = {
  slug: 'homePage',
  label: 'Home page',
  admin: { group: 'Settings', description: 'Hero slides, welcome message and the feature cards.' },
  access: { read: anyone, update: roles('superAdmin', 'editor') },
  fields: [
    {
      name: 'hero',
      type: 'array',
      label: 'Hero slides',
      minRows: 1,
      maxRows: 5,
      admin: {
        description:
          'Keep the headline short. Choose photographs with empty sky or wall on the left, so the words do not cover anyone’s face.',
      },
      fields: [
        { name: 'headline', type: 'text', required: true, maxLength: 70 },
        { name: 'subhead', type: 'text', maxLength: 140 },
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        {
          type: 'row',
          fields: [
            { name: 'buttonLabel', type: 'text', admin: { width: '50%' } },
            { name: 'buttonHref', type: 'text', admin: { width: '50%' } },
          ],
        },
      ],
    },
    {
      name: 'welcome',
      type: 'group',
      label: 'Head Teacher’s welcome',
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'Welcome from the Head Teacher' },
        { name: 'name', type: 'text', required: true },
        { name: 'title', type: 'text', defaultValue: 'Head Teacher' },
        { name: 'message', type: 'textarea', required: true },
        { name: 'photo', type: 'upload', relationTo: 'media' },
        { name: 'readMoreHref', type: 'text', defaultValue: '/about' },
      ],
    },
    {
      name: 'features',
      type: 'array',
      label: 'Why choose us',
      maxRows: 6,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true, maxLength: 200 },
        { name: 'image', type: 'upload', relationTo: 'media' },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'star',
          options: [
            { label: 'Book', value: 'book' },
            { label: 'Flask', value: 'flask' },
            { label: 'Trophy', value: 'trophy' },
            { label: 'Users', value: 'users' },
            { label: 'Heart', value: 'heart' },
            { label: 'Star', value: 'star' },
          ],
        },
      ],
    },
    {
      name: 'callToAction',
      type: 'group',
      fields: [
        { name: 'heading', type: 'text', defaultValue: 'Join our school community' },
        { name: 'body', type: 'textarea' },
        { name: 'buttonLabel', type: 'text', defaultValue: 'Start your application' },
        { name: 'buttonHref', type: 'text', defaultValue: '/admissions' },
      ],
    },
  ],
  hooks: { afterChange: [revalidateGlobalAfterChange(() => ['/'])] },
}
