import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { User } from "@/models/user/user";
import { Category } from "@/models/category/category";
import { Post } from "@/models/post/post";
import { Comment } from "@/models/comment/comment";

@Injectable()
export class DbService {
  constructor(private dataSource: DataSource) {
    setTimeout(() => {
      void this.seedData();
    }, 1000);
  }

  async testConnection() {
    await this.dataSource.query("SELECT 1");
  }

  async seedData() {
    await this.dataSource.transaction(async entityManager => {
      const userRepository = entityManager.getRepository<User>(User);
      const categoryRepository = entityManager.getRepository<Category>(Category);
      const postRepository = entityManager.getRepository<Post>(Post);
      const commentRepository = entityManager.getRepository<Comment>(Comment);

      const usersCount = await userRepository.count();
      if (usersCount > 0) {
        return;
      }

      // Users
      const savedUser1 = await userRepository.save(
        userRepository.create({
          username: "Sarah",
          email: "sarah@mail.com",
          profile: { bio: "Tech enthusiast and software developer" }
        })
      );
      const savedUser2 = await userRepository.save(
        userRepository.create({
          username: "Mike",
          email: "mike@mail.com",
          profile: { bio: "AI researcher and writer" }
        })
      );
      const savedUser3 = await userRepository.save(
        userRepository.create({
          username: "Emma",
          email: "emma@mail.com",
          profile: { bio: "Web developer and designer" }
        })
      );
      const savedUser4 = await userRepository.save(
        userRepository.create({
          username: "Alex",
          email: "alex@mail.com",
          profile: { bio: "Cloud architect and blogger" }
        })
      );

      // Categories
      const savedCat1 = await categoryRepository.save(
        categoryRepository.create({ name: "Technology" })
      );
      const savedCat2 = await categoryRepository.save(
        categoryRepository.create({ name: "AI", parentId: savedCat1.id })
      );
      const savedCat3 = await categoryRepository.save(
        categoryRepository.create({ name: "Web Development", parentId: savedCat1.id })
      );
      const savedCat4 = await categoryRepository.save(
        categoryRepository.create({ name: "Lifestyle" })
      );
      const savedCat5 = await categoryRepository.save(
        categoryRepository.create({ name: "Travel", parentId: savedCat4.id })
      );

      // Posts
      const savedPost1 = await postRepository.save(
        postRepository.create({
          title: "Getting Started with Machine Learning",
          content:
            "ML is transforming tech. Here are the basics to get you started on your journey.",
          categoryId: savedCat2.id,
          userId: savedUser2.id
        })
      );
      const savedPost2 = await postRepository.save(
        postRepository.create({
          title: "Best React Hooks in 2025",
          content:
            "useState and useEffect are essential, but these newer hooks will boost your productivity.",
          categoryId: savedCat3.id,
          userId: savedUser1.id
        })
      );
      const savedPost3 = await postRepository.save(
        postRepository.create({
          title: "My Trip to Japan",
          content:
            "Tokyo was amazing! The food, culture, and technology blend perfectly in this city.",
          categoryId: savedCat5.id,
          userId: savedUser3.id
        })
      );
      const savedPost4 = await postRepository.save(
        postRepository.create({
          title: "Neural Networks Explained",
          content:
            "Neural networks mimic the human brain. Let's break down how they work in simple terms.",
          categoryId: savedCat2.id,
          userId: savedUser2.id
        })
      );
      const savedPost5 = await postRepository.save(
        postRepository.create({
          title: "CSS Grid vs Flexbox",
          content:
            "Both are powerful layout tools. Grid excels at 2D layouts while Flexbox handles 1D layouts.",
          categoryId: savedCat3.id,
          userId: savedUser1.id
        })
      );

      // Comments
      await commentRepository.save(
        commentRepository.create({
          content: "Great introduction! Very helpful for beginners.",
          postId: savedPost1.id,
          userId: savedUser1.id
        })
      );
      await commentRepository.save(
        commentRepository.create({
          content: "Thanks for sharing. Which ML library do you recommend?",
          postId: savedPost1.id,
          userId: savedUser3.id
        })
      );
      await commentRepository.save(
        commentRepository.create({
          content: "useCallback is a game changer!",
          postId: savedPost2.id,
          userId: savedUser4.id
        })
      );
      await commentRepository.save(
        commentRepository.create({
          content: "I've been to Tokyo too. Did you visit Shibuya?",
          postId: savedPost3.id,
          userId: savedUser2.id
        })
      );
      await commentRepository.save(
        commentRepository.create({
          content: "Clear explanation. Could you cover CNNs next?",
          postId: savedPost4.id,
          userId: savedUser1.id
        })
      );
      await commentRepository.save(
        commentRepository.create({
          content: "I still struggle with when to use Grid. More examples please!",
          postId: savedPost5.id,
          userId: savedUser3.id
        })
      );
      await commentRepository.save(
        commentRepository.create({
          content: "Japan is on my bucket list!",
          postId: savedPost3.id,
          userId: savedUser4.id
        })
      );
      await commentRepository.save(
        commentRepository.create({
          content: "This clarified a lot of confusion for me.",
          postId: savedPost4.id,
          userId: savedUser3.id
        })
      );
    });
  }
}
