const { Client } = require("pg");
const { rows } = require("pg/lib/defaults");
const client = new Client("postgres://localhost:5432/juicebox-dev");

module.exports = {
  client,
};

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active FROM users;`
  );
  return rows;
}

async function createUser({ username, password, name, location }) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
    INSERT INTO users (username, password, name, location) 
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (username) DO NOTHING
    RETURNING *;`,
      [username, password, name, location]
    );

    return user;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");
  if (setString.length === 0) {
    return;
  }
  try {
    const {
      rows: [user],
    } = await client.query(
      `
    UPDATE users
    SET ${setString}
    WHERE id=${id}
    RETURNING *;
    `,
      Object.values(fields)
    );
    return user;
  } catch (error) {
    throw error;
  }
}

async function createPost({ authorId, title, content }) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `INSERT INTO posts ("authorId", title, content)
      VALUES ($1, $2, $3)
      RETURNING *;`,
      [authorId, title, content]
    );
    return post;
  } catch (error) {
    throw error;
  }
}

async function updatePost(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");
  if (setString.length === 0) {
    return;
  }
  try {
    const {
      rows: [post],
    } = await client.query(
      `
    UPDATE posts
    SET ${setString} 
    WHERE id=${id}
    RETURNING *;
    `,
      Object.values(fields)
    );
    return post;
  } catch (error) {
    console.log("Error in updatePost");
    throw error;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows } = await client.query(`
    SELECT * FROM posts
    WHERE "authorId"=${userId};
    `);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(`
    SELECT id, username, name, location, active FROM users
    WHERE id = ${userId}`);
    if (!user) {
      return null;
    }
    user.posts = await getPostsByUser(userId);
    return user;
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  const { rows } = await client.query(`SELECT * FROM posts;`);
  return rows;
}

async function createTags(tagList) {
  if (tagList.length === 0) {
    return;
  }

  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");
  console.log("INSERTVALUES", insertValues);

  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");
  console.log("SELECTVALUES", selectValues);

  const name = tagList.map((name) => {
    return name;
  });
  console.log("name", name);

  try {
    await client.query(`
    INSERT INTO tags(name)
    VALUES (${insertValues})
    ON CONFLICT (name) DO NOTHING;`);

    const { rows } = await client.query(`
    SELECT * FROM tags
    WHERE name
    in (${selectValues}) `);

    return rows;
  } catch (error) {
    console.log("Error in createTags");
    throw error;
  }
}

async function createPostTag(postId, tagId) {
  try {
    await client.query(
      `
    INSERT INTO post_tags("postId", "tagId")
    VALUES ($1, $2)
    ON CONFLICT ("postId", "tagId") DO NOTHING;`,
      [postId, tagId]
    );
  } catch (error) {
    console.log("Error in createPostTag");
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    console.log("Error in addTagsToPost");
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
    SELECT * FROM posts
    where id=$1;`,
      [postId]
    );

    const { rows: tags } = await client.query(
      `
    SELECT tags.* FROM tags
    JOIN post_tags ON tags.id=post_tags."tagId"
    where post_tags."postId"=$1;`,
      [postId]
    );

    const {
      rows: [author],
    } = await client.query(
      `
    SELECT id, username, name, location
    FROM users
    Where id=$1;`,
      [post.authorId]
    );

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    console.log("error in getPostById");
    throw error;
  }
}

module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getPostsByUser,
  getUserById,
  getAllPosts,
  createTags,
  addTagsToPost,
};
