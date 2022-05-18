FORMAT: 1A

# abc

## GET /?search=XXXX

|        |            |
| ------ | ---------- |
| t      | tag        |
| a      | author     |
| c      | character  |
| s      | series     |
| @      | and 検索   |
| &#124; | or 検索    |
| ()     | 検索優先順 |

?search=t:tag1@a:author1  
(tag1 && author1)

?search=(t:tag1|t:tag2)@t:tag3  
(tag1 || tag2) && tag3

+ Response 200 (application/json)
    {
      "page": {
        "current": 1,
        "last": 10
      },
      "mangaThumbnails": [
          {
              "title": "managaTitle1",
              "thumbnail": "/thumbnail.png",
              "authors": [
                "author1",
                "author2"
              ],
              "tags": [
                "tag1",
                "tag2"
              ],
              "characters": [
                "character1",
                "character2"
              ],
              "series": [
                "series1",
                "series2"
              ]
          },
          ...
      ]
    }
