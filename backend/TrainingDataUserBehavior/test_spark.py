from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("Test").getOrCreate()
print("✅ Spark is working!")
spark.stop()
