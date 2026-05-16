import axios from './httpRequester';

const path = 'core/student/courses';

class CourseService {

    // API-ENRL-06: 수강 신청 페이지 활성화 제어
    getCourseStatus() {
        return axios.get(`${path}/status`);
    }

    // API-ENRL-01: 수강 가능 강의 전체 조회
    courseList() {
        return axios.get(`${path}`);
    }

    // API-ENRL-02: 내 수강 신청 목록 조회
    myCourseList() {
        return axios.get(`${path}/my`);
    }

    // API-ENRL-03: 수강 신청 실행
    postCourse(data) {
        return axios.post(`${path}`, data);
    }

    // API-ENRL-04: 수강 신청 취소
    courseDel({ lectureId }) {
        return axios.delete(`${path}/${lectureId}`);
    }
}

export default new CourseService();