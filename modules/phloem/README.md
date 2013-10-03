Phloem
==========
*In vascular plants, phloem is the living tissue that carries organic nutrients, particularly sucrose, a sugar, to all parts of the plant where needed*

Phloem are the fundamental promise based structures and utility functions intended to transport information between different components in the [herbalism framework](http://github.com/herbalism).

Structures
----------
**Optional** An optional can have one of two states but not both. A value is either present or absent. While the value is present absent returns a promise and vince verca. An optional is useful for values that has a clear binary state and are expected to change during the course of the applications lifetime such as wether a user is logged in or not.

Since both present and absent return promises the present and absent state can be represented by complex objects. In the case of a user for instance the present state could be a user object while absent can be represented by a function that logs in the user given the correct credentials.

**Stream** A stream is a simple structure that models a continious source of information. A good example of a stream would be change events for a textbox. Whenever the text changes a new value is delivered via the stream.

The stream has two parts, the write part and the read part. The write part allows a source to push values to the stream and the read part has a promise for the *next* value.

When *next* resolves it resolves to an object containing the resolved *value* and a promise for the *next* value.

A stream has no memory, it is a little bit like a stream of water. As long as you are watching the stream you will see every value that is deliverd via the stream but you can not tell what has been delivered via the stream before you started listening.

**Queue** A queue is like a stream except that you are guaranteed to get the current state of the queue with all values currently in the queue regardless of when you start watching the queue.
As log as you watch the queue you will get updates the same way as with streams: an object containing the *value* which differs from the value in the stream in that it is an *aggregate* of the current state of the stream. The object will also contain a promis for the *next* update.

Utility functions
-----------------
**Iterate** You can iterate a *stream* or a *queue* in order to get the next value as a callback whenever it is available.

**Whenever** You can chain optionals with whenever. Whenever makes it easy to express things such as "whenever there is a storag (that is available whenever there is a user)".

