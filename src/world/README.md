# PixelWalker World Structure

TODO

### Blueprint Format Specification

A blueprint/ world structure can be encoded and decoded into a readable string with the `Structure` deserialization methods.
The specification only defines the root-level attributes and how the layer encoding works, not the model of the data, e.g. JSON or YAML.
The reserved root-level attributes are `generator: string`, `meta: object`, `width` and `height` numeric values to identify the dimensions of the world, `palette: string[]` a list of block mappings, and `data: string`, which stores the block array decoded.
The generator has to be the name identifying your library, if you choose to change the behaviour of the world serialization.

<!-- ### Magic Palette Syntax

The assertion holds that `palette` generated from a game world part will only hold legitime mappings, you can **opt in** support the _magic palette_ syntax:

- Top-level split of one character whitespace ` `, which stores an array of block mappings: e.g. `basic_white empty`, this gets treated as "try to interpret first entry, if it fails, go one with the next."
- Custom palette entries start with asterisk `*` and are defined in the code/ hard-coded. This allows for `*r` implementing the random block behaviour, `*basic` a basic block of defined color.  -->

### Structure Decoding Format

The `data` attribute is an array of layers, which can be quickly separated by splitting the newline `\n`.
The assertion holds, that there are `2` layers.
Every layer is on the other hand an array of blocks, which can be separated by splitting the whitespace character ` `.
The assertion, that there are `width * height` blocks, does **not** hold, see below.
A block starts with its' relative id indexing the `palette`, followed by either:

- It's block data following the colon `:`
  - Block data is separated by the comma `,` and it holds, that block data is decoded in such a way that splitting by comma is secure, save the bracket fragments.
- or a repetition marker `*`, showing how many blocks follow `1*3` is the same as `1 1 1`
