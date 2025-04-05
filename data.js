const resourceData = {
    "MementoMori": {
        "gameName": "MementoMori",
        "model": {
            "engine": "live2d",
            "idleMotionGroup": "Idle.anim",
            "useBackgroundModel": true,
            "backgroundMotionGroup": "EF_Idle.anim",
            "backgroundModelHiddenParts": [
                "Character"
            ]
        },
        "nameMap": {
            "CHR_000026": "\u6885\u6797",
            "CHR_000027": "\u79d1\u8fea"
        },
        "special": {
            "CHR_000026": {
                "modelHiddenParts": [
                    "front_effect_G"
                ],
                "backgroundModelHiddenParts": [
                    "staff_G",
                    "mein_G",
                    "fairy_G"
                ]
            },
            "CHR_000027": {
                "backgroundModelHiddenParts": [
                    "Part32"
                ]
            }
        },
        "characters": [
            "CHR_000026",
            "CHR_000027"
        ],
        "avatar": {
            "width": 128
        }
    },
    "WuNiang": {
        "gameName": "\u6b66\u5a18",
        "model": {
            "engine": "spine",
            "initialAnimation": "idle",
            "premultipliedAlpha": false
        },
        "nameMap": {
            "10_gumu": "\u53e4\u5893",
            "28_qingcheng": "\u9752\u57ce"
        },
        "characters": [
            "10_gumu",
            "28_qingcheng"
        ],
        "avatar": {
            "width": 100
        }
    }
}