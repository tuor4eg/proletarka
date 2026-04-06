# proletarka

Factory museum's application

# Factory Memory

A small mobile-first project about preserving the memory of a factory through short, visual, easy-to-browse materials.

## Project idea

This is not meant to be a heavy corporate website or a classic archive.

The goal is to create a simple and useful public project that helps people explore the history of the factory from a phone:

- people
- wartime history
- documents
- photos
- modern factory life
- materials that are still being processed

The project should feel like a "memory feed" or "living archive", not like a complicated museum database.

## Main product direction

The first version should be:

- simple
- mobile-first
- easy to launch
- easy to extend later

The public interface should focus on:

- a feed of cards
- topic filters
- a material details page
- search
- links to source materials or Telegram posts when available

Later this may also be opened inside Telegram as a Mini App, but that is not part of the first MVP.

## MVP scope

The first MVP should include only:

1. Public pages

- home page with a feed of materials
- filter by a few themes
- material details page
- simple search

2. Basic content management

- private admin page
- simple form to create a material
- edit existing material
- save as draft or publish
- upload one cover image or scan

3. Data model
   Start small.
   At first, one main entity is enough: `material`.

A material can represent:

- article
- photo
- document
- memoir
- handwritten text
- material in progress

## Initial themes

Use a small fixed set of themes at first:

- People
- War
- Documents
- Photos
- Factory Today

The theme list may grow later.

## Content principles

The project should support both polished and raw materials.

Some materials may be:

- fully written and ready to publish
- short and incomplete
- based on scans
- still in progress
- only partially transcribed

That is expected and is part of the concept.

## Non-goals for the first MVP

Do not build these yet:

- full CMS
- complicated role system
- OCR pipeline
- AI tagging
- Telegram bot posting flow
- Telegram Mini App integration
- advanced timeline
- interactive map
- separate entities for people/events/documents unless really needed
- overengineered architecture

Keep the first version small and practical.

## Technical direction

Preferred direction:

- Next.js
- PostgreSQL
- Drizzle ORM

Why:

- start with a real database from the beginning
- keep the architecture simple
- allow future growth without changing the whole model
- avoid a heavy CMS in the beginning

## Development principles

- mobile-first
- simple UI
- minimal complexity
- small iterative steps
- one clear change at a time
- explain changes before and after implementing them
- avoid unnecessary abstraction
- avoid premature optimization

## How Claude should help

When working on this project:

- first analyze the current state
- propose a short implementation plan
- make small, focused changes
- explain what changed
- prefer simple solutions over clever ones
- keep the MVP narrow
- do not introduce large frameworks or systems unless requested

## First milestone

Build a very small but usable version where a person can:

- open the site on a phone
- browse a list of materials
- filter by topic
- open one material
- search materials
- add a new material through a simple private form

That is enough for the first release.
