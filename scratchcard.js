$(document).ready(function() {

    var documentid = '';
    var tabname = '';
    var title = '';
    var subtitle = '';
    var problem_count = 0;
    var selection_count = 0;
    var pointdata = [];
    var answer = [];
    var alphabet = 'abcdefghijklmnopqrstuvwxyz';
    var useddic = {};
    var is_drag = false;
    var celldisable = [];

    // データファイルの読込み
    FileRead();

    if ($.cookie('documentid') != documentid)
    {
        // 識別符号が変更されていた場合は、クッキーのクリア
        for (var i=0; i<problem_count; i++)
        {
            for (var j=0; j<selection_count; j++)
            {
                $.removeCookie('answer_' + i + '_' + j);
            }
        }    
    }

    // 識別符号を再度クッキーに退避
    $.cookie('documentid', documentid, { expires: 1});

    // 日付の表示
    $('#nowtime').text(GetTime());

    // タイトルの追加
    $('title').text(tabname);
    $('#documentid').text(documentid);
    $('#title').text(title);
    $('#subtitle').text(subtitle);

    // 選択肢タイトルの追加
    $('#selectiontitle').attr('colspan', selection_count);
    for (var i=0; i<selection_count; i++) {
        var simbol = alphabet.substr(i, 1);
        $('#selection').append('<th>' + simbol + '</th>');
    }

    // 問題行と合計行の追加
    for (var i=0; i<=problem_count; i++)
    {        
        $('#tableBody').append('<tr></tr>');
    }
    $('#tableBody tr').each(function(i, e) {
        if (i == 0)
        {
            $(this).append('<th rowspan="' + problem_count + '">問題番号</th>');
        }
        if (i == problem_count)
        {
            $(this).append('<th id="pointsumtitle" colspan="' + Number(selection_count + 2) + '">合計得点</th>');
            $(this).append('<th id="pointsum"></th>');
            $('#pointsum').css('font-size', 30);
            $('#pointsum').text(0);
            return true;
        }
        else
        {
            $(this).append('<th>' + (i + 1) + '</th>');
        }

        // 選択肢+得点欄分の枠を追加
        for (var j=0; j<=selection_count; j++)
        {
            if (j == selection_count)
            {
                // 得点
                $(this).append('<td class="point" id="point_' + i +'"></td>');
                $('#point_' + i).css('text-align', 'center');
            }
            else
            {
                var id = 'answer_' + i + '_' + j;
                useddic[id] = false;
                $(this).append('<td>&ensp;<div class="scratchpad" id="' + id + '"></div></td>');
                var pic = 'none.jpg';
                
                if (answer[i] == j+1)
                {
                    // 正解の場合は、正解用を使用
                    pic = 'star.jpg'
                }
                var scratch = $('#' + id);
                $(scratch).wScratchPad({
                    bg: pic,
                    fg: '#cccccc',
                    cursor: 'coin.png',
                    size: 20
                });

                // すでに削った情報がクッキーに残っている場合は、スクラッチ済みにしておく
                var used = $.cookie(id);
                if (used != undefined && used == 1)
                {
                    $(scratch).wScratchPad('clear');
                    useddic[id] = true;
                }
            }
        }
    });

    // 合計の算出
    GetPoint();

    // タイトルテーブルの幅の設定
    var tablewidth = $('#tableData').css('width');
    $('#tableTitle').css('width', tablewidth);

    $(document).on('mousedown', '.scratchpad', function() {
        is_drag = true;
    });

    $(document).on('mouseup mouseleave', '.scratchpad', function() {
        if (is_drag === true)
        {
            var id = $(this).attr('id');

            if (celldisable.includes(id) == false)
            {
                // 削れるセルの場合のみ削る
                useddic[id] = true;
                $.cookie(id, 1, { expires: 1});
                GetPoint();
            }

            is_drag = false;
        }
    });

    $(document).on('click', '#capture', function() {
        if ($('#group').val() == '')
        {
            alert('班が入力されていません。')
        }
        else
        {
            DownloadImage();
        }
    });
    //------------------------------------------
	//	得点算出
	//------------------------------------------
    function GetPoint()
    {
        // 1行ずつ確認
        for (var i=0; i<problem_count; i++)
        {
            var amswercount = -1;
            var answeropen = false;
            for (var j=0; j<selection_count; j++)
            {
                var id = 'answer_' + i + '_' + j;
                if (useddic[id] == true)
                {
                    // すでにスクラッチ済みの個数をカウント
                    amswercount++;

                    if (answer[i] == j+1)
                    {
                        // 正解がスクラッチされていれば、フラグON
                        answeropen = true;
                    }
                }
                else
                {
                    var used = $.cookie(id);
                    if (used != undefined && used == 1)
                    {
                        // 別タブでクッキーが変更されていた場合は反映
                        $('#' + id).wScratchPad('clear');
                        useddic[id] = true;
                        amswercount++;

                        if (answer[i] == j+1)
                        {
                            // 正解がスクラッチされていれば、フラグON
                            answeropen = true;
                        }
                    }
                }
            }

            if (answeropen == true)
            {
                // 正解オープン済みの場合は得点を表示
                $('#point_' + i).text(pointdata[amswercount]);
                $('#point_' + i).css('font-size', 30);
                // 合計の算出
                SumPoint();

                // 正解が空いている行はそれ以上削れなくする
                for (var j=0; j<selection_count; j++)
                {
                    var id = 'answer_' + i + '_' + j;
                    if (useddic[id] == false)
                    {
                        $('#' + id).wScratchPad('enable', false);
                        if (celldisable.includes(id) == false)
                        {
                            // 削れなくしたセルを退避
                            celldisable.push(id);
                        }
                    }
                }
                
            }
        }
    }

    //------------------------------------------
	//	合計得点算出
	//------------------------------------------
	function SumPoint()
    {
        var pointsum = 0;
        for( var i=0; i<problem_count; i++ )
		{
			var data = $('#point_' + i).text();
			pointsum += Number(data);
		}
        $('#pointsum').text(pointsum);
    }

    //------------------------------------------
	//	データファイル読み込み
	//------------------------------------------
    function FileRead()
    {
        // 毎回最新ファイルを読むために、ファイル名にパラメータを付加
        var filever = GetTime();
        $.ajax( {
            url: 'setting.txt?ver=' + filever,
            detaType: 'text',
            async: false,
            success: function( data )
            {
                // 正常に読み込まれたときの処理
                var dataline = data.split('\r\n');
                $.each(dataline, function(index, value) {
                    var datawork = value.split('=');
                    switch(datawork[0])
                    {
                        case '識別符号':
                            documentid = datawork[1];
                            break;
                        case 'タブ名':
                            tabname = datawork[1];
                            break;
                        case 'タイトル':
                            title = datawork[1];
                            break;
                        case 'サブタイトル':
                            subtitle = datawork[1];
                            break;
                        case '問題数':
                            problem_count = Number(datawork[1]);
                            break;
                        case '選択肢数':
                            selection_count = Number(datawork[1]);
                            break;
                        case '各問題の正解の位置':
                            var temp = datawork[1].split(',');
                            $.each(temp, function(i, v) {
                                answer.push(Number(v));
                            })
                            break;
                        case '配点':
                            var temp = datawork[1].split(',');
                            $.each(temp, function(i, v) {
                                pointdata.push(Number(v));
                            })
                            break;
                    }
                })
            }
        })
    }

    //------------------------------------------
	//	画面キャプチャ保存
	//------------------------------------------
    function DownloadImage()
    {
        html2canvas(document.body, {
            onrendered: function(canvas) {
                var a = document.createElement('a');
                a.href = canvas.toDataURL("image/jpeg").replace("image/jpeg", "image/octet-stream");
                var filename = GetDate() + '_' + $('#group').val() + '班' + '.jpg';
                a.download = filename;
                a.click();
            }
        });
    }

    //------------------------------------------
	//	時刻取得
	//------------------------------------------
    function GetTime()
    {
        var now = new Date();
        var y = now.getFullYear();
        var m = now.getMonth() + 1;
        var d = now.getDate();
        var h = now.getHours();
        var mi = now.getMinutes();
        var s = now.getSeconds();

        var mm = ('0' + m).slice(-2);
        var dd = ('0' + d).slice(-2);
        var hh = ('0' + h).slice(-2);
        var mmi = ('0' + mi).slice(-2);
        var ss = ('0' + s).slice(-2);
        return (y + '/' + mm + '/' + dd + ' ' + hh + ':' + mmi + ':' + ss);
    }

    //------------------------------------------
	//	日時取得
	//------------------------------------------
    function GetDate()
    {
        var time = GetTime();
        time = time.substr(0, 10);
        time = time.replaceAll('/','');
        return (time);
    }
});