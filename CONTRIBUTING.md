# Contributing

Contributions that improve clarity, accessibility, linguistic accuracy, or browser compatibility are welcome.

## Module conventions

Each module should:

1. identify a small set of observable learning objectives;
2. support a focused activity that can be completed in one class segment;
3. expose the relevant computation rather than hide it behind an external service;
4. run entirely in the browser without user accounts or API keys;
5. use editable, appropriately licensed data; and
6. remain usable with a keyboard and on a narrow screen.

New modules should live in their own directory under `modules/`. Keep instructional content close to the module and place only genuinely shared styles or assets in `assets/`. Add the module's title, concepts, duration, and relative URL to `modules/catalog.js`; the collection page and shared navigation use that catalog.

## Testing a change

Run the automated model checks with:

```bash
npm test
```

Also confirm that the collection page and affected module load through a local web server.
