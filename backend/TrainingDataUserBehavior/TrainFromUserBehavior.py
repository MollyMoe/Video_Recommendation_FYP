from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALS
from pyspark.ml.feature import StringIndexer
from pyspark.ml.evaluation import RegressionEvaluator
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import json
from collections import defaultdict

def train_from_user_behavior(json_file="user_behavior.json", model_output_path="als_model"):
    # Step 1: Start Spark session
    spark = SparkSession.builder.appName("ALSRecommendation").getOrCreate()

    # Step 2: Load and cast data
    df = spark.read.json(json_file)
    df = df.selectExpr("cast(userId as string)", "cast(movieId as string)", "cast(rating as float)")

    # Step 3: Index userId and movieId
    user_indexer = StringIndexer(inputCol="userId", outputCol="userIndex")
    movie_indexer = StringIndexer(inputCol="movieId", outputCol="movieIndex")
    df = user_indexer.fit(df).transform(df)
    df = movie_indexer.fit(df).transform(df)

    # Step 4: Train ALS model
    als = ALS(
        userCol="userIndex",
        itemCol="movieIndex",
        ratingCol="rating",
        coldStartStrategy="drop",
        nonnegative=True
    )
    model = als.fit(df)

    # Step 5: Evaluate model
    predictions = model.transform(df)
    evaluator = RegressionEvaluator(metricName="rmse", labelCol="rating", predictionCol="prediction")
    rmse = evaluator.evaluate(predictions)
    print(f"📉 RMSE = {rmse:.4f}")

    # Step 6: Save model
    model.write().overwrite().save(model_output_path)
    print(f"✅ ALS model saved to: {model_output_path}")

    # Step 7: Generate top-N recommendations
    userRecs = model.recommendForAllUsers(500)
    userRecs = userRecs.selectExpr("userIndex", "explode(recommendations) as rec") \
                       .selectExpr("userIndex", "rec.movieIndex as movieIndex", "rec.rating as rating")

    # Step 8: Map back to original userId and movieId
    user_id_map = df.select("userId", "userIndex").dropDuplicates()
    movie_id_map = df.select("movieId", "movieIndex").dropDuplicates()
    userRecs = userRecs.join(user_id_map, on="userIndex").join(movie_id_map, on="movieIndex")

    # Step 9: Load user genre preferences from JSON
    genre_map = {}
    with open(json_file, "r") as f:
        for line in f:
            entry = json.loads(line)
            raw_genres = entry.get("titlegenres", [])
            if isinstance(raw_genres, str):
                genres = [g.strip().lower() for g in raw_genres.split("|")]
            else:
                genres = [g.strip().lower() for g in raw_genres]
            if genres:
                genre_map.setdefault(entry["userId"], set()).update(genres)

    # Step 10: Convert recommendations to pandas
    final_data = userRecs.select("userId", "movieId", "rating").toPandas()

    # Step 11: Connect to MongoDB
    load_dotenv()
    client = MongoClient(os.getenv("MONGO_URI"))
    movie_db = client["NewMovieDatabase"]
    movie_meta = movie_db["hybridRecommendation2"]
    alsCollection = movie_db["alsRecommendations"]

    # Step 12: Filter recommendations by genre match
    filtered_records = []
    for rec in final_data.to_dict("records"):
        user_genres = set(genre_map.get(rec["userId"], []))
        movie_doc = movie_meta.find_one({"movieId": rec["movieId"]}, {"genres": 1})

        if not movie_doc or not movie_doc.get("genres"):
            continue

        raw_movie_genres = movie_doc["genres"]
        if isinstance(raw_movie_genres, str):
            movie_genres = set(g.strip().lower() for g in raw_movie_genres.split("|"))
        else:
            movie_genres = set(g.strip().lower() for g in raw_movie_genres)

        print(f"👤 User genres: {user_genres} 🎬 Movie genres: {movie_genres}")

        if user_genres & movie_genres:  # At least one genre match
            rec["genres"] = list(movie_genres)
            filtered_records.append(rec)

    # Step 13: Sort and group top-N recommendations per user
    user_recs_sorted = defaultdict(list)
    for rec in filtered_records:
        user_recs_sorted[rec["userId"]].append(rec)

    sorted_final = []
    for uid, recs in user_recs_sorted.items():
        sorted_recs = sorted(recs, key=lambda x: -x["rating"])[:500]  # Top 500 per user
        sorted_final.extend(sorted_recs)

    # Step 14: Insert into MongoDB
    if sorted_final:
        alsCollection.delete_many({})
        alsCollection.insert_many(sorted_final)
        print(f"✅ Inserted {len(sorted_final)} genre-filtered and rating-sorted ALS recommendations into MongoDB")
    else:
        print("⚠️ No filtered recommendations to insert. Skipping insert_many.")

    # Step 15: Stop Spark
    spark.stop()

if __name__ == "__main__":
    train_from_user_behavior()



