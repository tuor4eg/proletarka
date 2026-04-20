# proletarka

Factory museum's application

# Factory Memory

A small mobile-first project about preserving the memory of a factory through people, materials, events, photos, and curated wartime history.

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

The project should remain:

- simple
- mobile-first
- easy to browse
- easy to extend without turning into a heavy CMS

The public interface should focus on:

- a feed of cards
- topic filters
- people pages
- wartime section
- a material details page
- search
- links between related materials, people, and objects

## Current scope

The project currently includes:

1. Public pages

- home page with a feed of materials
- people section
- wartime section
- artifact and exhibition pages
- filter by themes
- material details page
- simple search

2. Admin area

- private admin page
- create and edit people
- create and edit artifacts
- create and edit materials
- create and edit topics
- manage events for people
- save as draft or publish
- upload images
- link related materials and people

3. Data model

- `people`
- `artifacts`
- `materials`
- `events`
- `topics`
- `entities`
- `showcases`

Materials can represent:

- article
- photo
- document
- news
- group photo

## Topics and subtopics

Topics are no longer fully flat.

The admin now supports:

- root topics
- subtopics inside a root topic

The main intended use is editorial clarification inside an existing theme.  
For example:

- `war`
    - `war-mobilization`
    - `war-demobilization`
    - `war-killed`
    - `war-234-division`
- `factory`
    - `factory-hired`
    - `factory-dismissed`

Important rules:

- a subtopic is selected only together with its parent topic
- the project currently supports one nesting level: topic -> subtopic
- topic logic should rely on stable `code`, not on visible title

## System topics

Some topics are treated as system topics.

They exist to support stable public logic, especially in the wartime section.

System topics:

- are created with fixed codes
- can be renamed in the admin
- cannot be deleted
- cannot be moved to another parent

At the moment, the main system roots are:

- `war`
- `factory`

Their built-in subtopics are also system topics.

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
- interactive map
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

## Wartime section

The wartime section is one of the core public scenarios.

It currently combines:

- participant lists
- wartime photos
- a timeline of wartime events

### Participant lists

The lists of participants are built from a small set of stable topic codes:

- `war`
- `factory`
- `factory-dismissed`

This allows the project to distinguish between:

- people who worked at the factory before the war
- former workers
- people who came from the factory to the front
- people who joined the factory after the war

### Wartime timeline

The timeline is based on the `war` topic branch.

That means it may include:

- general wartime events marked with `war`
- mobilization events
- demobilization events
- death notices marked with `war-killed`

The timeline is not limited to 1941-1945.  
For example, it may include:

- pre-war mobilization in 1939
- post-war demobilization
- later commemorative wartime events

The years 1941-1945 are highlighted visually, but events outside those years still remain in the same chronological line.

Special wartime subtopics are grouped by year:

- mobilization events are shown first
- general wartime events stay in the middle
- demobilization and death-related events are placed at the end of the year

Some grouped wartime items are shown as one combined line with a list of people instead of repeating the same action many times.
