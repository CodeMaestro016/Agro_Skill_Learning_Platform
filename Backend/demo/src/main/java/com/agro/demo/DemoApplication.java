package com.agro.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.bson.Document;

@SpringBootApplication
public class DemoApplication {

	private final MongoTemplate mongoTemplate;

	public DemoApplication(MongoTemplate mongoTemplate) {
		this.mongoTemplate = mongoTemplate;
	}

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@EventListener(ApplicationReadyEvent.class)
	public void checkMongoConnection() {
		try {
			mongoTemplate.getDb().runCommand(new Document("ping", 1));
			System.out.println("=================================");
			System.out.println("MongoDB Connected Successfully! ");
			System.out.println("=================================");
		} catch (Exception e) {
			System.out.println("MongoDB Connection Failed!");
		}
	}

}
