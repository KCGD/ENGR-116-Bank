# One Click Bank

This is my submission for the one click bank.

I went for the check+, including password authentication, as well as hashing and storing said password in an account file.

# Running the code

## Dependenies

If you wish to run this code, make sure you have make, nodejs and npm installed.

Start by downloading it's dependencies (once in the project's root folder)

```bash
npm i
```

## Compiling

Then, compile the code. There are a few options for this:

### Runing in node
To run this in nodejs without compiling it to a standalone execut able, run:

```bash
make run
```

### Running as standalone
To compile this code to it's own binary, run

```bash
make build
```
Then, run the executable in the Builds folder

## Prebuilt
I also provided prebuilt versions of this code in this repositorie's "releases" sections.

# Cleaning up
This program stores all of it's persistant data in $HOME/.bank. Once you're done feel free to delete this folder.