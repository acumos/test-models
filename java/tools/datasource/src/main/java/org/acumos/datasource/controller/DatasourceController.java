/*-
 * ===============LICENSE_START=======================================================
 * Acumos
 * ===================================================================================
 * Copyright (C) 2017 - 2018 AT&T Intellectual Property & Tech Mahindra. All rights reserved.
 * ===================================================================================
 * This Acumos software file is distributed by AT&T and Tech Mahindra
 * under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *  
 *      http://www.apache.org/licenses/LICENSE-2.0
 *  
 * This file is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ===============LICENSE_END=========================================================
 */

package org.acumos.datasource.controller;

import java.lang.invoke.MethodHandles;
import java.util.List;

import javax.servlet.http.HttpServletResponse;

import org.acumos.datasource.service.ProtobufService;
import org.acumos.datasource.vo.Configuration;
import org.acumos.datasource.vo.Protobuf;
import org.acumos.datasource.vo.ProtobufServiceOperation;
import org.acumos.datasource.vo.Result;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import io.swagger.annotations.ApiOperation;

@RestController
public class DatasourceController {

	private static final Logger logger = LoggerFactory.getLogger(MethodHandles.lookup().lookupClass());

	@Autowired
	@Qualifier("ProtobufServiceImpl")
	private ProtobufService protoService;

	@ApiOperation(value = "Set the environment configuration.", response = Result.class)
	@RequestMapping(path = "/configDS", method = RequestMethod.PUT)
	public Object configureEnvironment(@RequestBody Configuration conf, HttpServletResponse response) {
		Result result = null;
		try {
			protoService.setConf(conf);
			protoService.processProtobuf();
			result = new Result(HttpServletResponse.SC_OK, "Environment configured successfully !!!");
		} catch (Exception e) {
			logger.error("DatasourceController failed while setting Environment configuration.", e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			result = new Result(HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
					"configureEnvironment failed: " + e.toString());
		}
		return result;
	}

	@ApiOperation(value = "Convert the input value into protobuf format and send input to configured Model Connector API URL. ")
	@RequestMapping(path = "/sendData", method = RequestMethod.POST)
	@ResponseBody
	public Object sendData(@RequestParam(value = "InputData", required = true) String input,
			HttpServletResponse response) {
		Object result = null;
		try {
			Protobuf protobuf = protoService.getProtobuf();
			org.acumos.datasource.vo.ProtobufService rpc = protobuf.getService();
			List<ProtobufServiceOperation> operations = rpc.getOperations();
			ProtobufServiceOperation operation = operations.get(0);
			String inputmessageName = operation.getInputMessageNames().get(0); // "DataFrame";
			String outputMessageName = operation.getOutputMessageNames().get(0); // DataFrameRow
			byte[] binaryStream = protoService.convertToProtobufFormat(inputmessageName, input);
			String uri = protoService.getConf().getEndpointURL();// "http://localhost:8080/modelconnector/classify";
			RestTemplate restTemplate = new RestTemplate();
			restTemplate.getMessageConverters().add(new StringHttpMessageConverter());
			byte[] mcResponse = restTemplate.postForObject(uri, binaryStream, byte[].class);
			result = protoService.readProtobufFormat(outputMessageName, mcResponse);
		} catch (Exception e) {
			logger.error("DatasourceController failed. Failed to convert to process data.", e);
			response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
			return new Result(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "sendData failed: " + e.toString());
		}
		return result;
	}
}
