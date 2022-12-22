/*
Deepfence ThreatMapper

Deepfence Runtime API provides programmatic control over Deepfence microservice securing your container, kubernetes and cloud deployments. The API abstracts away underlying infrastructure details like cloud provider,  container distros, container orchestrator and type of deployment. This is one uniform API to manage and control security alerts, policies and response to alerts for microservices running anywhere i.e. managed pure greenfield container deployments or a mix of containers, VMs and serverless paradigms like AWS Fargate.

API version: 2.0.0
Contact: community@deepfence.io
*/

// Code generated by OpenAPI Generator (https://openapi-generator.tech); DO NOT EDIT.

package deepfence_server_client

import (
	"encoding/json"
)

// checks if the ModelAgentId type satisfies the MappedNullable interface at compile time
var _ MappedNullable = &ModelAgentId{}

// ModelAgentId struct for ModelAgentId
type ModelAgentId struct {
	NodeId string `json:"node_id"`
}

// NewModelAgentId instantiates a new ModelAgentId object
// This constructor will assign default values to properties that have it defined,
// and makes sure properties required by API are set, but the set of arguments
// will change when the set of required properties is changed
func NewModelAgentId(nodeId string) *ModelAgentId {
	this := ModelAgentId{}
	this.NodeId = nodeId
	return &this
}

// NewModelAgentIdWithDefaults instantiates a new ModelAgentId object
// This constructor will only assign default values to properties that have it defined,
// but it doesn't guarantee that properties required by API are set
func NewModelAgentIdWithDefaults() *ModelAgentId {
	this := ModelAgentId{}
	return &this
}

// GetNodeId returns the NodeId field value
func (o *ModelAgentId) GetNodeId() string {
	if o == nil {
		var ret string
		return ret
	}

	return o.NodeId
}

// GetNodeIdOk returns a tuple with the NodeId field value
// and a boolean to check if the value has been set.
func (o *ModelAgentId) GetNodeIdOk() (*string, bool) {
	if o == nil {
		return nil, false
	}
	return &o.NodeId, true
}

// SetNodeId sets field value
func (o *ModelAgentId) SetNodeId(v string) {
	o.NodeId = v
}

func (o ModelAgentId) MarshalJSON() ([]byte, error) {
	toSerialize,err := o.ToMap()
	if err != nil {
		return []byte{}, err
	}
	return json.Marshal(toSerialize)
}

func (o ModelAgentId) ToMap() (map[string]interface{}, error) {
	toSerialize := map[string]interface{}{}
	toSerialize["node_id"] = o.NodeId
	return toSerialize, nil
}

type NullableModelAgentId struct {
	value *ModelAgentId
	isSet bool
}

func (v NullableModelAgentId) Get() *ModelAgentId {
	return v.value
}

func (v *NullableModelAgentId) Set(val *ModelAgentId) {
	v.value = val
	v.isSet = true
}

func (v NullableModelAgentId) IsSet() bool {
	return v.isSet
}

func (v *NullableModelAgentId) Unset() {
	v.value = nil
	v.isSet = false
}

func NewNullableModelAgentId(val *ModelAgentId) *NullableModelAgentId {
	return &NullableModelAgentId{value: val, isSet: true}
}

func (v NullableModelAgentId) MarshalJSON() ([]byte, error) {
	return json.Marshal(v.value)
}

func (v *NullableModelAgentId) UnmarshalJSON(src []byte) error {
	v.isSet = true
	return json.Unmarshal(src, &v.value)
}

