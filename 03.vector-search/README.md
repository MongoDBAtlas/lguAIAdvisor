<img src="https://companieslogo.com/img/orig/MDB_BIG-ad812c6c.png?t=1648915248" width="50%" title="Github_Logo"/> <br>


# MongoDB Atlas Training for LGU plus AI Advisor

### [&rarr; Semantic Search](#Vector)

### [&rarr; Hybrid Search](#Hybrid)

### [&rarr; Semantic API Node](#API)

<br>


### Vector
영화에 대해 단어를 이용한 검색이 아닌 문장으로 의미를 작성하여 검색을 진행 합니다. embedded_movies 컬렉션에 사전에 OpenAI 의 "ada-002-text"를 이용하여 vector data를 생성 한 것입니다.

sample_mflix.embedded_movies 컬렉션의 데이터로 plot_embedding 필드에 "ada-002-text" 서비스에 의해 plot 정보가 vector로 계산되어져 저장된 것입니다.    

<img src="/03.vector-search/images/images30.png" width="80%" height="80%">

해당 필드에 인덱스를 생성 하여 줍니다. Vector 의 차원은 1536이며 비교 연산은 euclidean을 사용 합니다.  
Atlas console에서 인덱스를 생성 하여 줍니다. 인덱스는 UI를 통해서 생성이 지원되지 않음으로 JSON을 이용한 생성을 선택 합니다.   

<img src="/03.vector-search/images/images40.png" width="80%" height="80%">


인덱스 이름을 vector_index로 지정 하고 plot_embedding 필드에 인덱스를 생성하며 type은 knnVector로 지정하고 차원 정보는 1536, 유사도는 euclidean을 입력 하여 줍니다. 장르 정보를 지정하여 검색 하기 위해 genres도 추가 하여 줍니다.     

`````
{
  "fields": [
    {
      "type": "vector",
      "path": "plot_embedding",
      "numDimensions": 1536,
      "similarity": "euclidean"
    },
    {
      "path": "genres",
      "type": "filter"
    }
  ]
}
`````

인덱스 생성 까지는 1-2분 정도가 소요되며 생성 완료는 search index 페이지에서 확인 가능 합니다.    

<img src="/03.vector-search/images/images41.png" width="80%" height="80%">


검색을 위해서 openAI (https://openai.com/ )에 무료 회원 가입 후 회원 정보 페이지에서 API 사용을 위한 API key를 생성 합니다.   


<img src="/03.vector-search/images/images32.png" width="70%" height="70%">

생성된 API 키는 다시 조회가 불가능 함으로 메모 하여 둡니다. 

OpenAI API를 이용하여 검색할 문장의 Vector 데이터를 생성하여 줍니다.   
다음과 같이 Authorization에 Bearer로 생성한 API key를 입력 하여 줍니다. Body의 data 에 검색할 문장을 input에 넣어 주고 모델을 text-embedding-ada-002로 입력 하여 줍니다. (해당 모델로 input 데이터에 대한 vector 값을 생성 하여 줍니다.)

`````
curl --location 'https://api.openai.com/v1/embeddings' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer <<OPENAI Key>>' \
--data '{
    "input": "Experience of shipwreck by Typhoon and surviving alone in small island.",     
    "model": "text-embedding-ada-002"
  }'
`````

호출의 결과로 Vector 데이터가 리턴이 됩니다. 그 결과는 다음과 같습니다.    

`````
{
    "object": "list",
    "data": [
        {
            "object": "embedding",
            "index": 0,
            "embedding": [
                -0.0028920018,
                -0.027676977,
                0.007235899,
                ...
                0.00018032902,
                -0.026289087
            ]
        }
    ],
    "model": "text-embedding-ada-002-v2",
    "usage": {
        "prompt_tokens": 16,
        "total_tokens": 16
    }
}
`````

호출에 대한 결과는 vector.json에 저장 하고 있음으로 이를 사용 할 수 있습니다.   
`````
[primary] sample_mflix> const vectorjson = require('./vector.json')
[primary] sample_mflix> let vector = vectorjson.data[0].embedding

[primary] sample_mflix> db.embedded_movies.aggregate([ { "$vectorSearch": { "index": "vector_index", "path": "plot_embedding", "queryVector": vector, "numCandidates": 200, "limit": 10 } }, { "$project": { "_id": 0, "title": 1, "genres": 1, "plot": 1, "released": 1, "score": { $meta: "vectorSearchScore" } } }] )
[
  {
    plot: 'A shipwrecked survivor discovers a remote island with a mad scientist.',
    genres: [ 'Adventure', 'Fantasy', 'Horror' ],
    title: 'The Island of Dr. Moreau',
    released: ISODate("1977-07-13T00:00:00.000Z"),
    score: 0.7824490666389465
  },
  {
    plot: 'After a collision with a shipping container at sea, a resourceful sailor finds himself, despite all efforts to the contrary, staring his mortality in the face.',
    genres: [ 'Action', 'Adventure', 'Drama' ],
    title: 'All Is Lost',
    released: ISODate("2013-11-07T00:00:00.000Z"),
    score: 0.7801877856254578
  },
  {
    plot: 'A terrifying tale of survival in the mangrove swamps of Northern Australia',
    genres: [ 'Action', 'Drama', 'Horror' ],
    title: 'Black Water',
    released: ISODate("2008-04-24T00:00:00.000Z"),
    score: 0.7797785401344299
  },
  {
    plot: 'A young man who survives a disaster at sea is hurtled into an epic journey of adventure and discovery. While cast away, he forms an unexpected connection with another survivor: a fearsome Bengal tiger.',
    genres: [ 'Adventure', 'Drama', 'Fantasy' ],
    title: 'Life of Pi',
    released: ISODate("2012-11-21T00:00:00.000Z"),
    score: 0.7781470417976379
  },
  {
    plot: "This is a survival story - a Hemingway's 'Old Man and the Sea' as if written for our days.",
    genres: [ 'Action', 'Adventure', 'Drama' ],
    title: 'The Old Man',
    released: ISODate("2014-09-08T00:00:00.000Z"),
    score: 0.7648832201957703
  },
  {
    plot: "This is a survival story - a Hemingway's 'Old Man and the Sea' as if written for our days.",
    genres: [ 'Action', 'Adventure', 'Drama' ],
    title: 'The Old Man',
    released: ISODate("2014-09-08T00:00:00.000Z"),
    score: 0.7648720741271973
  },
  {
    plot: 'A group of passengers struggle to survive and escape when their ocean liner completely capsizes at sea.',
    genres: [ 'Action', 'Adventure', 'Drama' ],
    title: 'The Poseidon Adventure',
    released: ISODate("1972-12-13T00:00:00.000Z"),
    score: 0.7635738849639893
  },
  {
    plot: 'An unusually intense storm pattern catches some commercial fishermen unaware and puts them in mortal danger.',
    genres: [ 'Action', 'Adventure', 'Drama' ],
    title: 'The Perfect Storm',
    released: ISODate("2000-06-30T00:00:00.000Z"),
    score: 0.7591977119445801
  },
  {
    plot: 'Shipwreck survivors are found on Beiru Island (Infanto tè), which was previously used for atomic tests. The interior is amazingly free of radiation effects, and they believe that they were ...',
    genres: [ 'Fantasy', 'Sci-Fi', 'Thriller' ],
    title: 'Mothra',
    released: ISODate("1962-05-10T00:00:00.000Z"),
    score: 0.7551210522651672
  },
  {
    plot: 'A boating accident runs a young man and woman ashore in a decrepit Spanish fishing town which they discover is in the grips of an ancient sea god and its monstrous half human offspring.',
    genres: [ 'Fantasy', 'Horror', 'Mystery' ],
    title: 'Dagon',
    released: ISODate("2001-10-31T00:00:00.000Z"),
    score: 0.7495789527893066
  }
]

`````

OpenAI의 API 호출 시 원한는 값을 Input에 넣어 Vector 값을 구해서 결과 검색이 가능합니다.   


`````
[primary] sample_mflix> let vector;

[primary] sample_mflix> var myHeaders = new Headers();

[primary] sample_mflix> myHeaders.append("Content-Type", "application/json");

[primary] sample_mflix> myHeaders.append("Authorization", "Bearer sk-bPm*****");

[primary] sample_mflix> var raw = JSON.stringify({ "input": "<<Text of what you want to do vector search>> ", "model": "text-embedding-ada-002" });

[primary] sample_mflix> var requestOptions = { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' }; 

[primary] sample_mflix> fetch("https://api.openai.com/v1/embeddings", requestOptions).then(response => response.text()).then(result => vector=result.data[0].embedding).catch(error => console.log('error', error));


[primary] sample_mflix> db.embedded_movies.aggregate([ { "$vectorSearch": { "index": "vector_index", "path": "plot_embedding", "queryVector": vector, "numCandidates": 200, "limit": 10 } }, { "$project": { "_id": 0, "title": 1, "genres": 1, "plot": 1, "released": 1, "score": { $meta: "vectorSearchScore" } } }] )


`````


### Hybrid
입력한 문장을 Semantic 형태로 검색도 진행 하며 동시에 단어 검색도 진행 합니다. Vector를 이용한 검색의 결과가 충분 하지 못 할 수 있기 때문에 단어를 이용한 검색도 병행합니다. 두개 검색 결과에 대한 정렬이 필요 하기 때문에 각 검색에 대한 Score를 이용하여 정렬을 하게 됩니다.

검색은 embedded_movies 컬렉션의 데이터로 plot_embedding 필드에 "ada-002-text"를 이용한 vector 데이터로 검색 하고 동시에 title 필드에 대해서 full text 검색을 진행 합니다.    

Vector index는 기존에 생성 한 인덱스 "vector_index"를 이용합니다. Search를 위해 검색 인덱스를 생성 합니다.    

sample_mflix.embedded_movies를 선택 후 Search Indexes에서 인덱스를 생성 합니다.   
빠른 생성을 위해 Json 방식을 선택 합니다.   

<img src="/03.vector-search/images/images51.png" width="70%" height="70%"> 

다음 검색 인덱스 선언용 json 메시지를 입력 하고 인덱스의 이름을 search_index로 지정하여 줍니다.      
title, plot, fullplot, cast 필드를 대상으로 하여 검색을 인덱스를 생성 하는 설정 입니다.   

`````
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": [
        {
          "type": "string"
        }        
      ],
      "plot":[
        {
          "type": "string"
        }
      ],
      "fullplot":[
        {
          "type": "string"
        }
      ],
      "cast":[
        {
          "type": "string"
        }
      ]
    }
  }
}
`````

<img src="/03.vector-search/images/images52.png" width="70%" height="70%"> 

인덱스를 저장하면 생성이 진행 됩니다.   

<img src="/03.vector-search/images/images53.png" width="70%" height="70%"> 

인덱스 생성이 완료 되면 검색을 위한 Query를 작성 합니다.   
벡터 검색에 대한 가중치를 0.9로 주고 단어 검색에 0.1을 주고 실행 합니다.  
기본 검색 Score는 BM25를 기준으로 산출이 되며 이 값을 지수 함수로 계산하고 가중치를 준것 입니다.  

`````
[primary] sample_mflix> const vectorjson = require('./hybrid.json')
[primary] sample_mflix> let vector = vectorjson.data[0].embedding
[primary] sample_mflix> const vectorWeight = 0.9
[primary] sample_mflix> const fullTextWeight = 0.1
[primary] sample_mflix> let vector = vectorjson.data[0].embedding


[primary] sample_mflix> let hybrid = 
[
  {
    "$vectorSearch": {
      "index": "vector_index",
      "queryVector": vector,
      "path": "plot_embedding",
      "numCandidates": 100,
      "limit": 20
    }
  },
  {
    "$addFields": {
      "vs_score": {
        "$meta": "vectorSearchScore"
      }
    }
  },
  {
    "$project": {
      "title": "$title",
      "image": "$poster",
      "description": "$plot",
      "cast": "$cast",
      "genres": "$genres",
      "vs_score": {
        "$multiply": [
          vectorWeight,
          {
            "$divide": [
              1,
              {
                "$sum": [
                  1,
                  {
                    "$exp": {
                      "$multiply": [
                        -1,
                        "$vs_score"
                      ]
                    }
                  }
                ]
              }
            ]
          }
        ]
      }
    }
  },
  {
    "$unionWith": {
      "coll": "embedded_movies",
      "pipeline": [
        {
          "$search": {
            "index": "search_index",
            "text": {
              "query": "fighting gohosts",
              "path": ["title","fullplot","plot","cast"]
            }
          }
        },
        {
          "$limit": 20
        },
        {
          "$addFields": {
            "fts_score": {
              "$meta": "searchScore"
            }
          }
        },
        {
          "$project": {
            "fts_score": {
              "$multiply": [
                fullTextWeight,
                {
                  "$divide": [
                    1,
                    {
                      "$sum": [
                        1,
                        {
                          "$exp": {
                            "$multiply": [
                              -1,
                              "$fts_score"
                            ]
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            },
            "title": "$title",
            "image": "$poster",
            "description": "$plot",
            "cast": "$cast",
            "genres": "$genres"
          }
        }
      ]
    }
  },
  {
    "$group": {
      "_id": "$_id",
      "vs_score": {
        "$max": "$vs_score"
      },
      "fts_score": {
        "$max": "$fts_score"
      },
      "title": {
        "$first": "$title"
      },
      "image": {
        "$first": "$image"
      },
      "description": {
        "$first": "$description"
      },
      "cast": {
        "$first": "$cast"
      },
      "genres": {
        "$first": "$genres"
      }
    }
  },
  {
    "$project": {
      "_id": 1,
      "title": 1,
      "image": 1,
      "description": 1,
      "vs_score": {
        "$ifNull": [
          "$vs_score",
          0
        ]
      },
      "fts_score": {
        "$ifNull": [
          "$fts_score",
          0
        ]
      },
      "cast": "$cast",
      "genres": "$genres"
    }
  },
  {
    "$addFields": {
      "score": {
        "$add": [
          "$fts_score",
          "$vs_score"
        ]
      }
    }
  },
  {
    "$sort": {
      "score": -1
    }
  },
  {
    "$limit": 10
  }
]


[primary] sample_mflix> db.embedded_movies.aggregate(hybrid)

`````

검색의 결과는 다음과 같이 나오게 됩니다.   

`````
[primary] sample_mflix> db.embedded_movies.aggregate(hybrid)
[
  {
    _id: ObjectId("573a139af29313caabcef0a4"),
    title: 'Casper',
    image: 'https://m.media-amazon.com/images/M/MV5BZThhYTlhMDUtMDhjZi00MTljLTkwMDYtOGU3ZjVlMWE4NDk4XkEyXkFqcGdeQXVyMTQxNzMzNDI@._V1_SY1000_SX677_AL_.jpg',
    description: 'A paranormal expert and his daughter bunk in an abandoned house populated by 3 mischievous ghosts and one friendly one.',
    vs_score: 0.6046620703731529,
    fts_score: 0,
    cast: [
      'Chauncey Leopardi',
      'Spencer Vrooman',
      'Malachi Pearson',
      'Cathy Moriarty'
    ],
    genres: [ 'Comedy', 'Family', 'Fantasy' ],
    score: 0.6046620703731529
  },
  {
    _id: ObjectId("573a13cef29313caabd880e3"),
    title: 'Monster Brawl',
    image: 'https://m.media-amazon.com/images/M/MV5BMTMxMTgwMTQ3Ml5BMl5BanBnXkFtZTcwMDY4OTc0NA@@._V1_SY1000_SX677_AL_.jpg',
    description: 'Eight classic monsters fight to the death in an explosive wrestling tournament set inside an abandoned and cursed graveyard.',
    vs_score: 0.6046583212455693,
    fts_score: 0,
    cast: [ 'Dave Foley', 'Art Hindle', 'Robert Maillet', 'Jimmy Hart' ],
    genres: [ 'Action', 'Comedy', 'Horror' ],
    score: 0.6046583212455693
  },
  {
    _id: ObjectId("573a13acf29313caabd26b23"),
    title: 'Despiser',
    image: 'https://m.media-amazon.com/images/M/MV5BMTQ2NDg1MTkxN15BMl5BanBnXkFtZTYwODE4ODk5._V1_SY1000_SX677_AL_.jpg',
    description: "Having just been fired and dumped by his wife, life couldn't possibly be worse for independent artist GORDON HAUGE (Mark Redfield)--until he wrecks his car and finds himself in purgatory ...",
    vs_score: 0.604558718000763,
    fts_score: 0,
    cast: [ 'Mark Redfield', 'Doug Brown', 'Gage Sheridan', 'Frank Smith' ],
    genres: [ 'Fantasy', 'Horror' ],
    score: 0.604558718000763
  },
  ...

`````



### API
문장을 이용하여 영화를 검색 하는 API서비스를 작성합니다. OpenAPI를 이용하기 위해서 API Key를 생성 하여야 합니다.
node 폴더에 nodejs로 작성된 애플리케이션을 이용 합니다.   


#### Env File
.env 파일 생성

MongoDB 접근 정보 및 사용할 Database 지정    
````
MONGODB=mongodb+srv://USER_ID:PASSWORD@cluster1.5qjlg.mongodb.net/
DATABASE=sample_mflix
COLLECTION=embedded_movies
OPENAPI=<<OPENAI Key>>

````

#### Module 설치

`````
$ npm install
$ npm install -D nodemon
`````
REST API(OpenAI) 호출을 위한 axios외에 express, mongodb가 설치 됩니다. 

#### Express 시작

`````
$ npm start
`````
3000 번 포트로 시작 됩니다.

#### REST API 호출

`````
curl --location 'http://localhost:3000/movie/' \
--header 'Content-Type: application/json' \
--data '{
"text": "Experience of shipwreck by Typhoon and surviving alone in small island."
}'
`````

Postman으로 호출한 결과 입니다.   

<img src="/03.vector-search/images/image01.png" width="90%" height="90%">  