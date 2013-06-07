function FileProgress(){};

//��ʼ������
FileProgress.prototype.initInterface = function(){
	var interface ="";
		interface += '<p class="up_item"><a href="javascript:;" class="confirm_btn" rel="nofollow"><span>�����Ƭ</span></a><span id="uploading"></span></p>';
		interface += '<div id="upload_box" class="up_item"><div id="upbox_content">';
		interface += '<p id="up_tips">����ѡ����Ƭ������60�ţ�������Ƭ��С������3MB�� </p>';
		interface += '<table id="upbox_data"><thead><tr><th width="40%">ͼƬ</th><td width="20%">��С</td><td width="20%">�ϴ�����</td><td width="20%">����</td></tr></thead><tbody id="up_list"></tbody></table>';
		interface += '</div><div id="upbox_ctrl"><a href="javascript:;" id="clearAll" rel="nofollow">����б�</a>�� <em id="fileNum">0</em> �� �ܼƣ�<em id="totalSize">0</em> KB </div>';
		interface += '</div>';
		
	$("#up_photo").html(interface);

	// ����б�
	$("#clearAll").click(function(){
		$.showWindow({
			id:"delAll",
			title:"��ʾ",
			content:"��ȷ��Ҫ����б���",
			button:[{
				callback:function(){
					$("#up_list").find("tr").remove();
					$("#fileNum, #totalSize").text("0");
					return true;
				}
			}]
		})
	})
}

//��ʼ������
FileProgress.prototype.initData = function(swfObj,initData){

	var _this = this;
		_this.swfObj = swfObj;
		_this.movieName = swfObj.movieName;
		_this.targetID = swfObj.getSetting("progressTarget");
		_this.fileUploadLimit = swfObj.getSetting("file_upload_limit");
		_this.fileUploadNewId = {};
		_this.fileUpload = 0;
		_this.fileUploadSuccess = 0;
		_this.swfObj = swfObj;

	$.each(initData,function(i){
		var fileID = _this.setFileId("ready_" + _this.fileUpload),
			origFileName = initData[i].data.origFileName,
			fileType = initData[i].data.fileType,
			fileSize = initData[i].data.fileSize;
		var _file = {
				name:origFileName,
				type:"." + fileType,
				size:fileSize,
				prices:filePrices
			};
		_this.insert(
			fileID,_file,_this.targetID)
		
		_this.setComplete(fileID,_file,JSON.stringify(initData[i]));
	})
	if(initData.length>0){		
		this.continueUpload();

	}
}

//�����ϴ�
FileProgress.prototype.continueUpload = function(){
	var upTips = $("#up_tips"),
		upData = $("#upbox_data"),
		fileNum = $("#fileNum"),
		totalSize = $("#totalSize");
	if(upData.css("display") == "none"){
		upTips.hide();
		upData.show();
		fileNum.text(this.fileUploadLimit);
	}
}

//�ϴ�����
FileProgress.prototype.changeLimitUploadNum = function(Num){
	var limitUploadNum = $("#limitNum");
		
}

//�жӳ���
FileProgress.prototype.showTips = function(){
	$.showTips({type: "warn" ,message: "�ļ����������ƣ���ɾ���������" , autoclose: 3});
}

//����������
FileProgress.prototype.insert = function(fileID,file,targetID){
	
	this.fileProgressID = fileID;
	this.fileType = file.type;

	this.opacity = 100;
	this.height = 0;	

	this.fileProgressWrapper = document.getElementById(this.fileProgressID);
	if (!this.fileProgressWrapper) {
		this.fileProgressWrapper = document.createElement("tr");
		this.fileProgressWrapper.id = this.fileProgressID;

		//ͼƬ
		var upName = document.createElement("th");
		upName.className = "upName";
		upName.appendChild(document.createTextNode(file.name));
		
		//��С
		var upSize = document.createElement("td");
		upSize.className = "upSize";
		filesize = Math.round(parseFloat(file.size)/1024*100)/100 + "KB";
		upSize.appendChild(document.createTextNode(filesize));

		//�ϴ�����
		var upStatus = document.createElement("td");
		upStatus.className = "upStatus";
		upStatus.innerHTML = '<p class="percent"><em>&nbsp;</em></p>';

		//����
		var upOperate = document.createElement("td");
		upOperate.className = "upOperate";
		upOperate.innerHTML = '<a class="del iblock" title="ȡ��" rel="nofollow" href="javascript:;">ȡ��</a>'

		this.fileProgressWrapper.appendChild(upName);
		this.fileProgressWrapper.appendChild(upSize);
		this.fileProgressWrapper.appendChild(upStatus);
		this.fileProgressWrapper.appendChild(upOperate);

		document.getElementById(targetID).appendChild(this.fileProgressWrapper);

	} else {
		this.fileProgressElement = this.fileProgressWrapper.firstChild;
		this.reset();
	}

	this.height = this.fileProgressWrapper.offsetHeight;
}

FileProgress.prototype.setTimer = function (timer) {
	this.fileProgressElement["FP_TIMER"] = timer;
};
FileProgress.prototype.getTimer = function (timer) {
	return this.fileProgressElement["FP_TIMER"] || null;
};

FileProgress.prototype.reset = function () {
	this.appear();	
};

//������
FileProgress.prototype.setProgress = function (fileID, percentage) {
	var fileWrapper = $("#" + fileID),
		upStatus = fileWrapper.find(".percent");
	upStatus[0].innerHTML = "<em>&nbsp;</em>";
	upStatus[0].childNodes[0].style.width = percentage + "%";
	this.appear();	
};

//������
FileProgress.prototype.setComplete = function (fileID, file, serverData) {
	var _this = this,
		resObj = JSON.parse(serverData),
		fileWrapper = $("#" + fileID),
		upStatus = fileWrapper.find(".upStatus"),
		delAttach = fileWrapper.find(".del");

	delAttach.live("click",function(){_this.delAttach(fileID);})

	if(resObj.success){
		delAttach.live("click",function(){_this.delAttach(fileID);})
		fileWrapper.append("<input name='fileOrigName' type='hidden' value='"+file.name+"'>");
		fileWrapper.append("<input name='fileDomain' type='hidden' value='"+resObj.data.domain+"'>");
		fileWrapper.append("<input name='filePath' type='hidden' value='"+resObj.data.path+"'>");
		fileWrapper.append("<input name='fileName' type='hidden' value='"+resObj.data.name+"'>");
		this.fileUploadSuccess++;
		this.fileUploadLimit--;
	}
};

//�������
FileProgress.prototype.setError = function (fileID) {
	var fileWrapper = $("#" + fileID);
	fileWrapper.find(".upName")[0].style.color = "#999";
	fileWrapper.find(".upSize").html("");
	fileWrapper.find(".upStatus").html("");
	fileWrapper.find(".upOperate").html("");
};

//������ʾ
FileProgress.prototype.setStatus = function (fileID, status) {
	var fileWrapper = $("#" + fileID);
		upSize = fileWrapper.find(".upSize");
	upSize[0].className = "upSize c_orange";
	upSize[0].innerHTML = status;
};

FileProgress.prototype.appear = function () {
	if (this.getTimer() !== null) {
		clearTimeout(this.getTimer());
		this.setTimer(null);
	}
};

//ɾ������
FileProgress.prototype.delAttach = function(fileID){
	var _this = this;
	$.showWindow({
		id:"delPhoto",
		title:"��ʾ",
		content:"��ȷ��Ҫɾ����",
		button:[{
			callback:function(){
				$("#" + fileID).remove();
			//	_this.changeLimitUploadNum(-1);
				$("#delPhoto").remove();
				return true;
			}
		}]})
}

//����fileID
FileProgress.prototype.setFileId = function(fileID){
	var _this = this;
		fileUpload = _this.fileUpload;
		_this.fileUploadNewId[fileID] = _this.movieName + "_" + fileUpload;
		_this.fileUpload ++;
	return _this.movieName + "_" + fileUpload;
}

//��ȡfileID
FileProgress.prototype.getFileId = function(fileID){
	return this.fileUploadNewId[fileID];
}