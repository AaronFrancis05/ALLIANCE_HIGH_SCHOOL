/**
 * The blocks an editor can stack to build a page.
 *
 * Each one maps to a component in `src/components/blocks/`. Keep the set small: more
 * blocks mean more ways for a page to end up looking wrong.
 */

import type { Block } from 'payload'

const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'Text', plural: 'Text blocks' },
  fields: [{ name: 'content', type: 'richText', required: true }],
}

const ImageWithTextBlock: Block = {
  slug: 'imageWithText',
  labels: { singular: 'Image with text', plural: 'Images with text' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'content', type: 'richText', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'imagePosition',
      type: 'select',
      defaultValue: 'right',
      options: [
        { label: 'Image on the right', value: 'right' },
        { label: 'Image on the left', value: 'left' },
      ],
    },
  ],
}

const CardsBlock: Block = {
  slug: 'cards',
  labels: { singular: 'Card row', plural: 'Card rows' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'cards',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      required: true,
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', required: true, maxLength: 240 },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'star',
          options: [
            { label: 'Star', value: 'star' },
            { label: 'Book', value: 'book' },
            { label: 'Graduation cap', value: 'cap' },
            { label: 'Users', value: 'users' },
            { label: 'Trophy', value: 'trophy' },
            { label: 'Building', value: 'building' },
            { label: 'Heart', value: 'heart' },
          ],
        },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
}

const TimelineBlock: Block = {
  slug: 'timeline',
  labels: { singular: 'Timeline', plural: 'Timelines' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'milestones',
      type: 'array',
      minRows: 2,
      required: true,
      fields: [
        { name: 'year', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'textarea', maxLength: 240 },
      ],
    },
  ],
}

const FaqBlock: Block = {
  slug: 'faq',
  labels: { singular: 'Questions and answers', plural: 'Question sets' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      required: true,
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}

const TableBlock: Block = {
  slug: 'table',
  labels: { singular: 'Table', plural: 'Tables' },
  admin: { group: 'Data' },
  fields: [
    { name: 'heading', type: 'text' },
    {
      name: 'columns',
      type: 'array',
      minRows: 2,
      maxRows: 6,
      required: true,
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'rows',
      type: 'array',
      minRows: 1,
      required: true,
      fields: [
        {
          name: 'cells',
          type: 'array',
          minRows: 1,
          required: true,
          fields: [{ name: 'value', type: 'text', required: true }],
        },
      ],
    },
    { name: 'note', type: 'text', admin: { description: 'Small print under the table.' } },
  ],
}

const CtaBlock: Block = {
  slug: 'callToAction',
  labels: { singular: 'Call to action', plural: 'Calls to action' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'body', type: 'textarea', maxLength: 240 },
    { name: 'buttonLabel', type: 'text', required: true },
    { name: 'buttonHref', type: 'text', required: true },
  ],
}

const VideoBlock: Block = {
  slug: 'videoEmbed',
  labels: { singular: 'Video', plural: 'Videos' },
  fields: [
    { name: 'heading', type: 'text' },
    { name: 'video', type: 'relationship', relationTo: 'videos', required: true },
  ],
}

export const contentBlocks: Block[] = [
  RichTextBlock,
  ImageWithTextBlock,
  CardsBlock,
  TimelineBlock,
  FaqBlock,
  TableBlock,
  VideoBlock,
  CtaBlock,
]
