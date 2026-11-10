'''
The following python script takes a csv file of location responses and compares each to the correct location
The distance of each of the location responses calculated to determine who was the closest.

'''

import pandas as pd
from haversine import haversine

# Coordinates of two points (latitude, longitude)
# point1 = (40.7128, -74.0060)  # New York City
# point2 = (34.0522, -118.2437) # Los Angeles

responses=pd.read_csv("landmarks_quiz - responses.csv")
responses.drop_duplicates(subset=['email', 'question_num'], inplace=True)


responses['distance']=None
questions=pd.read_csv("landmarks_quiz - questions.csv", index_col='question_num')


# row =questions.loc['y']
# step 1, calculate distance between each response
for index, a in responses.iterrows():
    q=questions.loc[a['question_num']]

    distance = haversine((a['lat'], a['lng']), (q['question_answer_lat'], q['question_answer_lng']))
    responses.at[index, 'distance'] = distance


result = responses.groupby('email').agg({'distance': ['sum', 'count']})

print (result.sort_values('distance  sum',ascending=False))
